#include <WiFi.h>
#include <PubSubClient.h>

#define ssid "linksys"
#define password ""

#define pot 14

WiFiClient espClient;
PubSubClient client(espClient);

const char* mqtt_server = "10.110.12.99";
const int mqtt_port = 1883;

// Acima deste valor o ESP pede uma foto ao celular (topico railsense/camera/capturar).
const int limiar_captura = 3000;
// Intervalo minimo entre dois pedidos de captura, para nao inundar o backend.
const unsigned long intervalo_captura_ms = 10000;
unsigned long ultima_captura = 0;

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

  char mensagem[64];
  snprintf(mensagem, sizeof(mensagem), "{\"device\":\"esp32-01\",\"valor\":%d}", valor);

  client.publish(
    "railsense/sensor/vibracao",
    mensagem
  );

  Serial.print("Enviado: ");
  Serial.println(mensagem);

  if (valor >= limiar_captura && (ultima_captura == 0 || millis() - ultima_captura >= intervalo_captura_ms)) {
    char comando[64];
    snprintf(comando, sizeof(comando), "{\"device\":\"esp32-01\",\"valor\":%d}", valor);
    client.publish("railsense/camera/capturar", comando);
    ultima_captura = millis();

    Serial.print("Captura solicitada: ");
    Serial.println(comando);
  }

  delay(1000);
}