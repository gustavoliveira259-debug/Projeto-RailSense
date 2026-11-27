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
(no `docker-compose.yml`: `tcp://broker:1883`; no Render, o broker na nuvem, veja abaixo).
Vazio desliga a assinatura.

**Formato da mensagem:**
JSON com as métricas de vibração da última janela de 1 s, calculadas a partir
de amostras do sensor piezoelétrico a 2 kHz (ADC 0-4095):

- `valor`: pico da janela;
- `rms`: valor RMS da janela (energia da vibração);
- `impactos`: quantas vezes o sinal passou do limiar de impacto.

JSON com o ID do dispositivo e a leitura bruta do ADC (0 a 4095).

**Exemplo:**


**Frequência de envio:**
1 segundo (uma mensagem por janela).

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

### Broker na nuvem (acessível de qualquer PC)

O Mosquitto do `docker-compose.yml` só é alcançado de dentro da rede do PC que o roda.
Para o ESP32, o backend no Render e qualquer PC usarem o mesmo broker pela internet,
use o **EMQX Cloud Serverless**. A conexão é MQTT com TLS na porta **8883** e exige
usuário e senha.

A cota gratuita é mensal: 1 milhão de minutos de sessão e 1 GB de tráfego (entrada +
saída). Três conexões ligadas o mês todo (ESP32, backend e uma ponte) gastam ~130 mil
minutos. O tráfego é o limite que importa: um ESP32 publicando a cada 1 s, 24 h por dia,
gasta ~0,5 GB/mês (a mensagem entra no broker e sai para o backend). Desligue o ESP32
quando não estiver usando.

> O HiveMQ Cloud Serverless não aceita mais clusters novos e será desligado em
> 31/12/2026. O "Free Lab License" do HiveMQ é para rodar o broker na sua própria
> máquina, o que não resolve o acesso de fora da rede.

1. Crie a conta pelo <https://www.emqx.com/en/cloud/serverless-mqtt> e um deployment
   **Serverless**. Na criação, deixe o **Spend Limit** em **0**: assim ele nunca passa
   da cota gratuita nem cobra nada.
2. No **Overview** do deployment, copie o endereço (ex.: `xxxxxxxx.ala.us-east-1.emqxsl.com`)
   e confira a porta **8883** (MQTT over TLS).
3. Em **Access Control → Authentication**, crie um usuário (ex.: `railsense`) e uma senha.
   Pode ser um só para tudo, ou um por dispositivo.
4. Configure cada parte com o mesmo endereço:

   | Onde | O que preencher |
   |---|---|
   | ESP32 (`hardware/include/secrets.h`) | `MQTT_SERVER "xxxxxxxx.ala.us-east-1.emqxsl.com"`, `MQTT_PORT 8883`, `MQTT_USER`, `MQTT_PASSWORD` (veja `secrets.example.h`) |
   | Backend (Render → Environment, ou `.env` do compose) | `MQTT_BROKER_URL=ssl://xxxxxxxx.ala.us-east-1.emqxsl.com:8883`, `MQTT_USUARIO`, `MQTT_SENHA` |
   | `serial_bridge.py` (`hardware/.env`) e `camera_bridge.py` (`camera/.env`) | `MQTT_BROKER=xxxxxxxx.ala.us-east-1.emqxsl.com`, `MQTT_PORT=8883`, `MQTT_USUARIO`, `MQTT_SENHA` |

   Com a porta 8883 o TLS liga sozinho no firmware e nas pontes. O firmware confere o
   certificado do broker com as raízes de `hardware/include/ca_cert.h` (Let's Encrypt e
   DigiCert G2/G3/G5). Se a ESP32 não conectar e o endereço estiver certo, baixe o
   **CA Certificate** no Overview do deployment e acrescente-o nesse arquivo.
5. Grave o firmware de novo (`pio run -e esp32dev -t upload`) e confira no monitor
   serial: `Conectando ao MQTT ...:8883 (TLS)... conectado!`. No log do backend deve
   aparecer `MQTT conectado em ssl://...`.
6. Para ver as mensagens chegando, use o [MQTTX](https://mqttx.app) (cliente MQTT
   gratuito) com o mesmo endereço, porta 8883, SSL/TLS ligado e o usuário criado, e
   assine `railsense/#`. Feche-o depois: cada assinante conta no tráfego.

Cuidados:

- **Rede da escola:** ela pode bloquear a porta 8883 ou ter login por página (portal
  cativo), que o ESP32 não consegue fazer. Se o ESP32 ficar em `estado=-2`, teste com o
  roteador do celular. O modo USB (abaixo) também funciona com o broker na nuvem: a
  ponte serial sai pela internet do PC.
- **Render gratuito:** o backend hiberna após ~15 min sem requisições HTTP, e a conexão
  MQTT não conta como uso. Enquanto ele dorme, as leituras de vibração se perdem (o
  broker não guarda mensagens QoS 0). Deixe o painel aberto durante a demonstração ou
  acorde o backend abrindo `https://<servico>.onrender.com/actuator/health`.
- **Senhas fora do Git:** `secrets.h`, `hardware/.env` e `camera/.env` não devem ir
  para o repositório.

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

**Publicador:** ESP32 (quando o pico da janela passa de `limiar_captura`, no máximo 1 vez a cada 10 s)

**Assinante:** `camera/camera_bridge.py` (com `MQTT_BROKER` definido)

**Exemplo:**

```json
{"device":"esp32-01","valor":2310,"rms":180,"impactos":3}
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
