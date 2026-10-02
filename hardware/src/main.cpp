#include <WiFi.h>
#include <PubSubClient.h>

#define ssid "Wokwi-GUEST"
#define password ""

#define pot 14

WiFiClient espClient;
PubSubClient client(espClient);

const char* mqtt_server = "SEU_BROKER";
const int mqtt_port = 1883;

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

void setup() {
  Serial.begin(115200);

  setup_wifi();

  client.setServer(mqtt_server, mqtt_port);
}

void loop() {

  if (!client.connected()) {
    reconnect();
  }

  client.loop();

  int valor = analogRead(pot);

  char mensagem[10];
  sprintf(mensagem, "%d", valor);

  client.publish(
    "railsense/sensor/vibracao",
    mensagem
  );

  Serial.print("Enviado: ");
  Serial.println(mensagem);

  delay(1000);
}