# Tópicos MQTT — RailSense

## Sensor de vibração

**Tópico:**
`railsense/sensor/vibracao`

**Descrição:**
Recebe os valores de vibração coletados pelo ESP32.

**Publicador:**
ESP32

**Formato da mensagem:**
Valor numérico inteiro.

**Exemplo:**

```text
2048
```

**Frequência de envio:**
1 segundo.

### Fluxo

```text
ESP32
  ↓
railsense/sensor/vibracao
  ↓
MQTT Broker
  ↓
Backend
```

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
