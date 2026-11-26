"""Ponte USB -> MQTT para o ESP32 gravado no modo USB (ambiente esp32dev-usb).

O firmware escreve uma linha por mensagem na serial:
    VIB {"device":"esp32-01","valor":2048}   -> railsense/sensor/vibracao
    CAP {"device":"esp32-01","valor":3120}   -> railsense/camera/capturar
Este script lê essas linhas e publica no broker, do mesmo jeito que o firmware
faria pelo Wi-Fi. Outras linhas da serial são só exibidas.

Configuração por variáveis de ambiente ou hardware/.env:
    SERIAL_PORT   porta do ESP32 (ex.: COM5); vazio procura sozinho
    SERIAL_BAUD   padrão 115200
    MQTT_BROKER   padrão localhost (o mesmo broker que o backend assina)
    MQTT_PORT     padrão 1883
"""

import json
import os
import time

import paho.mqtt.client as mqtt
import serial
from serial.tools import list_ports


def carregar_env(caminho=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")):
    """Lê hardware/.env (CHAVE=valor) sem sobrescrever variáveis já definidas no ambiente."""
    if not os.path.exists(caminho):
        return
    with open(caminho, encoding="utf-8") as arquivo:
        for linha in arquivo:
            linha = linha.strip()
            if linha and not linha.startswith("#") and "=" in linha:
                chave, valor = linha.split("=", 1)
                os.environ.setdefault(chave.strip(), valor.strip())


carregar_env()

SERIAL_PORT = os.environ.get("SERIAL_PORT", "")
SERIAL_BAUD = int(os.environ.get("SERIAL_BAUD", "115200"))
MQTT_BROKER = os.environ.get("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.environ.get("MQTT_PORT", "1883"))

TOPICOS = {
    "VIB": "railsense/sensor/vibracao",
    "CAP": "railsense/camera/capturar",
}

# Conversores USB-serial das placas ESP32 mais comuns (CP210x, CH340/CH9102, FTDI).
CHIPS_ESP32 = ("CP210", "CH340", "CH910", "USB-SERIAL", "FT232", "USB SERIAL")


def achar_porta():
    if SERIAL_PORT:
        return SERIAL_PORT
    for porta in list_ports.comports():
        if any(chip in (porta.description or "").upper() for chip in CHIPS_ESP32):
            return porta.device
    return None


def interpretar(linha):
    """Devolve (tópico, payload) para linhas VIB/CAP com JSON válido; None para o resto."""
    prefixo, _, resto = linha.partition(" ")
    topico = TOPICOS.get(prefixo)
    if not topico:
        return None
    try:
        json.loads(resto)
    except ValueError:
        return None
    return topico, resto


def conectar_mqtt():
    cliente = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"railsense-serial-{os.getpid()}")
    cliente.on_connect = lambda c, u, f, rc, p: print(
        f"MQTT conectado em {MQTT_BROKER}:{MQTT_PORT}" if rc == 0 else f"MQTT recusou a conexão: {rc}")
    cliente.on_disconnect = lambda c, u, f, rc, p: print(f"MQTT desconectado ({rc}); reconectando")
    # Assíncrono: se o broker ainda não subiu, o loop tenta de novo sozinho.
    cliente.connect_async(MQTT_BROKER, MQTT_PORT)
    cliente.loop_start()
    return cliente


def main():
    cliente = conectar_mqtt()
    while True:
        porta = achar_porta()
        if not porta:
            print("ESP32 não encontrado em nenhuma porta USB; tentando de novo em 5 s")
            time.sleep(5)
            continue
        try:
            with serial.Serial(porta, SERIAL_BAUD, timeout=2) as conexao:
                print(f"Lendo o ESP32 em {porta} ({SERIAL_BAUD} baud)")
                while True:
                    linha = conexao.readline().decode("utf-8", errors="replace").strip()
                    if not linha:
                        continue
                    mensagem = interpretar(linha)
                    if mensagem is None:
                        print(f"[esp32] {linha}")
                        continue
                    topico, payload = mensagem
                    if cliente.is_connected():
                        cliente.publish(topico, payload)
                        print(f"{topico} <- {payload}")
                    else:
                        print(f"(sem MQTT, descartado) {payload}")
        except serial.SerialException as erro:
            # Cabo desconectado ou porta ocupada (ex.: monitor serial aberto em outro programa).
            print(f"Serial indisponível em {porta}: {erro}; tentando de novo em 3 s")
            time.sleep(3)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
