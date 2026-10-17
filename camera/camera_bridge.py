"""Ponte entre a câmera do celular (app de câmera IP) e o backend RailSense.

O celular roda um app de câmera IP (ex.: "IP Webcam" no Android) na mesma rede
Wi-Fi. Este script busca a foto atual do celular de tempos em tempos e envia
para POST /api/imagens. Se MQTT_BROKER estiver definido, também captura quando
o ESP32 publicar em railsense/camera/capturar e avisa cada envio em
railsense/camera/imagem.

Configuração por variáveis de ambiente ou camera/.env (veja camera/.env.example).
"""

import io
import json
import os
import threading
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
import requests
from PIL import Image


def carregar_env(caminho=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")):
    """Lê camera/.env (CHAVE=valor) sem sobrescrever variáveis já definidas no ambiente."""
    if not os.path.exists(caminho):
        return
    with open(caminho, encoding="utf-8") as arquivo:
        for linha in arquivo:
            linha = linha.strip()
            if linha and not linha.startswith("#") and "=" in linha:
                chave, valor = linha.split("=", 1)
                os.environ.setdefault(chave.strip(), valor.strip())


carregar_env()

CAMERA_URL = os.environ["CAMERA_URL"]                     # ex.: http://192.168.0.50:8080/shot.jpg
CAMERA_USER = os.environ.get("CAMERA_USER", "")
CAMERA_PASSWORD = os.environ.get("CAMERA_PASSWORD", "")

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8080").rstrip("/")
BACKEND_EMAIL = os.environ["BACKEND_EMAIL"]
BACKEND_PASSWORD = os.environ["BACKEND_PASSWORD"]
EIXO_ID = int(os.environ["EIXO_ID"])

INTERVALO = float(os.environ.get("INTERVALO_SEGUNDOS", "30"))   # 0 desliga o envio periódico

MQTT_BROKER = os.environ.get("MQTT_BROKER", "")                 # vazio desliga o MQTT
MQTT_PORT = int(os.environ.get("MQTT_PORT", "1883"))
TOPICO_COMANDO = "railsense/camera/capturar"
TOPICO_IMAGEM = "railsense/camera/imagem"

# Limite de upload padrão do Spring é 1 MB; deixamos folga para o multipart.
TAMANHO_MAXIMO = 950 * 1024
LARGURA_MAXIMA = 1280


class Backend:
    """Mantém uma sessão autenticada no backend (cookie de sessão + token CSRF)."""

    def __init__(self):
        self.http = requests.Session()

    def _csrf(self):
        resposta = self.http.get(f"{BACKEND_URL}/api/auth/csrf", timeout=10)
        resposta.raise_for_status()
        return self.http.cookies.get("XSRF-TOKEN") or resposta.json()["token"]

    def login(self):
        self.http.cookies.clear()
        resposta = self.http.post(
            f"{BACKEND_URL}/api/auth/login",
            json={"email": BACKEND_EMAIL, "password": BACKEND_PASSWORD},
            headers={"X-XSRF-TOKEN": self._csrf()},
            timeout=10,
        )
        if resposta.status_code != 200:
            raise RuntimeError(f"Login no backend falhou (HTTP {resposta.status_code}): {resposta.text}")
        print(f"Autenticado no backend como {BACKEND_EMAIL}")

    def enviar_imagem(self, jpeg, tentar_novamente=True):
        resposta = self.http.post(
            f"{BACKEND_URL}/api/imagens",
            files={"file": (f"captura-{int(time.time())}.jpg", jpeg, "image/jpeg")},
            data={"eixoId": str(EIXO_ID)},
            headers={"X-XSRF-TOKEN": self._csrf()},
            timeout=120,
        )
        if resposta.status_code in (401, 403) and tentar_novamente:
            self.login()
            return self.enviar_imagem(jpeg, tentar_novamente=False)
        if resposta.status_code != 201:
            raise RuntimeError(f"Backend recusou a imagem (HTTP {resposta.status_code}): {resposta.text}")
        return resposta.json()


def buscar_foto():
    """Baixa a foto atual do celular e garante um JPEG abaixo do limite do backend."""
    autenticacao = (CAMERA_USER, CAMERA_PASSWORD) if CAMERA_USER else None
    resposta = requests.get(CAMERA_URL, auth=autenticacao, timeout=10)
    resposta.raise_for_status()

    if len(resposta.content) <= TAMANHO_MAXIMO and resposta.headers.get("Content-Type", "").startswith("image/jpeg"):
        return resposta.content

    imagem = Image.open(io.BytesIO(resposta.content)).convert("RGB")
    if imagem.width > LARGURA_MAXIMA:
        imagem = imagem.resize((LARGURA_MAXIMA, round(imagem.height * LARGURA_MAXIMA / imagem.width)))
    for qualidade in (85, 70, 55, 40):
        saida = io.BytesIO()
        imagem.save(saida, "JPEG", quality=qualidade)
        if saida.tell() <= TAMANHO_MAXIMO:
            return saida.getvalue()
    raise RuntimeError("Não foi possível gerar uma imagem abaixo de 1 MB.")


backend = Backend()
mqtt_client = None
trava = threading.Lock()


def capturar(origem):
    """Captura e envia uma foto. Pedidos que chegam durante um envio são ignorados."""
    if not trava.acquire(blocking=False):
        print(f"[{origem}] envio anterior em andamento, pedido ignorado")
        return
    try:
        horario = datetime.now(timezone.utc)
        resultado = backend.enviar_imagem(buscar_foto())
        print(f"[{origem}] imagem #{resultado['imagemId']} enviada"
              f" classificacao={resultado.get('classificacao')} alerta={resultado.get('alertaId')}")
        if mqtt_client is not None:
            mqtt_client.publish(TOPICO_IMAGEM, json.dumps({
                "imagemId": resultado["imagemId"],
                "eixoId": EIXO_ID,
                "origem": origem,
                "classificacao": resultado.get("classificacao"),
                "alertaId": resultado.get("alertaId"),
                "timestamp": horario.isoformat(),
            }))
    except Exception as erro:  # mantém o serviço rodando se o celular ou o backend cair
        print(f"[{origem}] falha: {erro}")
    finally:
        trava.release()


def iniciar_mqtt():
    global mqtt_client

    def ao_conectar(client, userdata, flags, reason_code, properties):
        client.subscribe(TOPICO_COMANDO)
        print(f"MQTT conectado, aguardando pedidos em {TOPICO_COMANDO}")

    def ao_receber(client, userdata, mensagem):
        # Executa fora da thread do MQTT para não travar o recebimento de mensagens.
        threading.Thread(target=capturar, args=("esp32",), daemon=True).start()

    mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    mqtt_client.on_connect = ao_conectar
    mqtt_client.on_message = ao_receber
    mqtt_client.connect_async(MQTT_BROKER, MQTT_PORT)
    mqtt_client.loop_start()


def main():
    backend.login()
    if MQTT_BROKER:
        iniciar_mqtt()

    print(f"Câmera: {CAMERA_URL} | eixo {EIXO_ID} | intervalo {INTERVALO or 'desligado'}s")
    while True:
        if INTERVALO > 0:
            capturar("intervalo")
            time.sleep(INTERVALO)
        else:
            time.sleep(3600)


if __name__ == "__main__":
    main()
