// Firmware do sensor de vibração do RailSense.
//
// Dois modos, escolhidos pelo ambiente do PlatformIO (hardware/platformio.ini):
//   esp32dev      Wi-Fi + MQTT: publica direto no broker.
//   esp32dev-usb  USB: escreve as mensagens na serial e hardware/serial_bridge.py
//                 publica no broker. Não precisa de Wi-Fi.
// Nos dois modos as mensagens e os tópicos são os mesmos (mqtt/topics.md).

#include <Arduino.h>

#ifndef RAILSENSE_USB
#include <WiFi.h>
#include <PubSubClient.h>
#endif

#define ssid "Wokwi-GUEST"
#define password ""

#define pot 14

// Mesmo valor do campo "Sensor de vibração" do eixo em Cadastros.
#define DEVICE_ID "esp32-01"

#ifndef RAILSENSE_USB
WiFiClient espClient;
PubSubClient client(espClient);

const char* mqtt_server = "192.168.56.1";
const int mqtt_port = 1883;
#endif

// Acima deste valor o ESP pede uma foto ao celular (topico railsense/camera/capturar).
const int limiar_captura = 3000;
// Intervalo minimo entre dois pedidos de captura, para nao inundar o backend.
const unsigned long intervalo_captura_ms = 10000;
unsigned long ultima_captura = 0;

#ifdef RAILSENSE_USB

// Uma linha por mensagem: "<prefixo> <json>". O prefixo diz à ponte em qual tópico publicar:
// VIB -> railsense/sensor/vibracao, CAP -> railsense/camera/capturar. Outras linhas são só log.
void publicar(const char* prefixo, const char* mensagem) {
  Serial.print(prefixo);
  Serial.print(' ');
  Serial.println(mensagem);
}

void setup() {
  Serial.begin(115200);
  Serial.println("RailSense: modo USB, mensagens pela serial");
}

#else

void setup_wifi() {
  delay(10);

  Serial.println("Conectando ao Wi-Fi...");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Wi-Fi conectado!");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Conectando ao MQTT...");

    if (client.connect("ESP32-Wokwi")) {
      Serial.println(" conectado!");
    } else {
      Serial.print(" falhou, estado=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void publicar(const char* prefixo, const char* mensagem) {
  const char* topico = prefixo[0] == 'C' ? "railsense/camera/capturar" : "railsense/sensor/vibracao";
  client.publish(topico, mensagem);
  Serial.print("Enviado em ");
  Serial.print(topico);
  Serial.print(": ");
  Serial.println(mensagem);
}

void setup() {
  Serial.begin(115200);

  setup_wifi();

  client.setServer(mqtt_server, mqtt_port);
}

#endif

void loop() {

#ifndef RAILSENSE_USB
  if (!client.connected()) {
    reconnect();
  }

  client.loop();
#endif

  int valor = analogRead(pot);

  char mensagem[64];
  snprintf(mensagem, sizeof(mensagem), "{\"device\":\"" DEVICE_ID "\",\"valor\":%d}", valor);
  publicar("VIB", mensagem);

  if (valor >= limiar_captura && (ultima_captura == 0 || millis() - ultima_captura >= intervalo_captura_ms)) {
    publicar("CAP", mensagem);
    ultima_captura = millis();
  }

  delay(1000);
}
