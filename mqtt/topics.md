# Tópicos MQTT — RailSense

O backend assina `railsense/sensor/+` (variável `MQTT_ENABLED=true`) e grava cada
leitura no rolamento ao qual o sensor está ligado.

## Formato da mensagem (todos os tópicos)

JSON com o identificador do dispositivo e o valor medido:

```json
{"device":"esp32-01","valor":2048}
```

- `device`: precisa ser igual ao **código do sensor** cadastrado pela TI em
  "Estrutura e sensores". Um mesmo dispositivo pode ter um sensor de cada tipo.
- `valor`: número (inteiro ou decimal).

Mensagens de dispositivos não cadastrados ou desativados são ignoradas (o backend
avisa uma vez no log). Corpo sem `device` ou sem `valor` numérico também é ignorado.

## Sensor de vibração

**Tópico:** `railsense/sensor/vibracao`

**Publicador:** ESP32 (`src/main.cpp`), a cada 1 segundo.

O firmware atual envia a leitura bruta do ADC (0–4095), por isso a interface mostra
a vibração em "un." (unidades brutas), sem unidade física.

## Sensor de temperatura

**Tópico:** `railsense/sensor/temperatura`

**Valor:** graus Celsius. Ainda não há firmware publicando neste tópico; até lá o
gráfico de temperatura fica vazio.

## Fluxo

```text
ESP32
  ↓  railsense/sensor/<tipo>  {"device": ..., "valor": ...}
MQTT Broker
  ↓
Backend (grava leitura e atualiza o último valor do sensor)
  ↓
Frontend (gráficos atualizados a cada 10 s)
```

## Convenção dos tópicos

```text
railsense/<categoria>/<tipo>
```

## Teste manual

Com o broker do docker-compose no ar:

```bash
docker exec monitoramento-broker mosquitto_pub -t railsense/sensor/vibracao -m '{"device":"esp32-01","valor":2048}'
```
