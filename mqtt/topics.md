# Tópicos MQTT — RailSense

## Sensor de vibração

**Tópico:**
`railsense/sensor/vibracao`

**Descrição:**
Recebe os valores de vibração coletados pelo ESP32.

**Publicador:**
ESP32

**Assinante:**
Backend (`VibracaoMqttListener`), quando `MQTT_BROKER_URL` está definido
(no `docker-compose.yml`: `tcp://broker:1883`). Vazio desliga a assinatura, como no Render.

**Formato da mensagem:**
JSON com o ID do dispositivo e a leitura bruta do ADC (0 a 4095).

**Exemplo:**

```json
{"device":"esp32-01","valor":2048}
```

**Frequência de envio:**
1 segundo.

### Vínculo com o eixo

A mensagem não diz de qual eixo é a leitura. Em **Cadastros → Eixos**, preencha
"Sensor de vibração" com o mesmo valor de `device` (ex.: `esp32-01`). Cada sensor
fica em um único eixo. Leituras de um `device` sem eixo, de eixo desativado ou
fora do formato são descartadas.

O backend grava as leituras em `leituras_vibracao` e apaga as com mais de
`VIBRACAO_RETENCAO_DIAS` dias (padrão 7). O frontend mostra o gráfico
"Vibração em tempo real" na página do eixo e na de cada alerta, via
`GET /api/eixos/{id}/vibracao?minutos=10` (1 a 60 minutos). A linha tracejada é
`VIBRACAO_LIMIAR` (padrão 3000), o mesmo `limiar_captura` do firmware.

### Fluxo

```text
ESP32
  ↓
railsense/sensor/vibracao
  ↓
MQTT Broker
  ↓
Backend → leituras_vibracao → GET /api/eixos/{id}/vibracao → gráfico ao vivo
```

### ESP32 pelo cabo USB (sem Wi-Fi)

Quando a rede não deixa o ESP32 alcançar o broker (ex.: rede da escola), grave o
firmware no modo USB. Ele escreve as mesmas mensagens na serial, e
`hardware/serial_bridge.py` publica nos mesmos tópicos:

```bash
cd hardware
pio run -e esp32dev-usb -t upload          # grava o firmware (porta detectada sozinha)
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python serial_bridge.py      # SERIAL_PORT e MQTT_BROKER opcionais (hardware/.env)
```

Feche o monitor serial do PlatformIO antes de rodar a ponte: só um programa
pode usar a porta por vez.

> Se houver um Mosquitto instalado direto no Windows além do container,
> `localhost:1883` pode cair nele, e não no broker do compose. O ESP32 e o
> backend precisam publicar e assinar no **mesmo** broker.

## Câmera do celular

O celular funciona como câmera IP: roda um app como o **IP Webcam** (Android),
na mesma rede Wi-Fi do servidor e do ESP32, e serve a foto atual em
`http://<ip-do-celular>:8080/shot.jpg`. O serviço `camera/camera_bridge.py`
busca essa foto de tempos em tempos (e quando o ESP32 pede) e envia para
`POST /api/imagens` (campo `file` + `eixoId`). Não é preciso abrir nenhum site
no celular.

```bash
pip install -r camera/requirements.txt
cp camera/.env.example camera/.env   # preencha CAMERA_URL, credenciais e EIXO_ID
python camera/camera_bridge.py
```

### Pedido de captura

**Tópico:** `railsense/camera/capturar`

**Publicador:** ESP32 (quando a leitura passa de `limiar_captura`, no máximo 1 vez a cada 10 s)

**Assinante:** `camera/camera_bridge.py` (com `MQTT_BROKER` definido)

**Exemplo:**

```json
{"device":"esp32-01","valor":3120}
```

O conteúdo é apenas informativo: qualquer mensagem nesse tópico dispara uma captura.

### Imagem enviada

**Tópico:** `railsense/camera/imagem`

**Publicador:** `camera/camera_bridge.py`, depois que o backend aceita a imagem

**Exemplo:**

```json
{"imagemId":12,"eixoId":1,"origem":"esp32","classificacao":"NORMAL","alertaId":null,"timestamp":"2026-10-16T13:00:00.000Z"}
```

`origem` pode ser `intervalo` ou `esp32`.

### Fluxo

```text
Celular (IP Webcam) <--GET /shot.jpg-- camera_bridge.py   (a cada INTERVALO_SEGUNDOS)
ESP32 --railsense/camera/capturar--> Broker --> camera_bridge.py
camera_bridge.py --POST /api/imagens--> Backend
camera_bridge.py --railsense/camera/imagem--> Broker
```

## Convenção dos tópicos

Os tópicos seguem o padrão:

```text
railsense/<tipo>/<sensor>
```

Exemplo:

```text
railsense/sensor/vibracao
```
