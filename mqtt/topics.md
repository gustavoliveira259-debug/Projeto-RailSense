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

## Convenção dos tópicos

Os tópicos seguem o padrão:

```text
railsense/<tipo>/<sensor>
```

Exemplo:

```text
railsense/sensor/vibracao
```
