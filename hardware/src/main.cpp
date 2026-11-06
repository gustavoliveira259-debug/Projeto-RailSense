#include <WiFi.h>
#include <PubSubClient.h>

#include "secrets.h"  // WIFI_SSID, WIFI_PASSWORD, MQTT_SERVER, MQTT_PORT (veja include/secrets.example.h)

// Sensor analógico na placa de expansão: S -> GPIO34, V -> 3V3, G -> GND.
// Precisa ser um pino do ADC1 (GPIO32-39): o ADC2 (ex.: GPIO14) não lê com o Wi-Fi ligado.
// GPIO34 é só entrada e não tem pull-up, ideal para sinal analógico.
#define PINO_SENSOR 34
// LED azul da ESP32 DevKit: aceso = conectado ao broker.
#define PINO_LED 2

#define DEVICE_ID "esp32-01"
#define TOPICO_LEITURA "railsense/sensor/vibracao"
#define TOPICO_CAPTURA "railsense/camera/capturar"

// Acima deste valor (0-4095) o ESP pede uma foto ao celular (topico railsense/camera/capturar).
const int limiar_captura = 3000;
// Intervalo minimo entre dois pedidos de captura, para nao inundar o backend.
const unsigned long intervalo_captura_ms = 10000;
const unsigned long intervalo_leitura_ms = 1000;
// Amostras por leitura, para reduzir o ruído do ADC.
const int amostras = 16;

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long ultima_leitura = 0;
unsigned long ultima_captura = 0;
unsigned long ultima_tentativa_mqtt = 0;

void conectar_wifi() {
  Serial.printf("Conectando ao Wi-Fi %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long inicio = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - inicio > 20000) {
      Serial.println("\nWi-Fi nao conectou em 20 s (rede 2.4 GHz? senha certa?). Reiniciando...");
      ESP.restart();
    }
    delay(500);
    Serial.print(".");
  }

  Serial.printf("\nWi-Fi conectado! IP %s\n", WiFi.localIP().toString().c_str());
}

// Tenta conectar ao broker sem travar o loop: no máximo uma tentativa a cada 5 s.
void conectar_mqtt() {
  if (millis() - ultima_tentativa_mqtt < 5000 && ultima_tentativa_mqtt != 0) {
    return;
  }
  ultima_tentativa_mqtt = millis();

  Serial.printf("Conectando ao MQTT %s:%d...", MQTT_SERVER, MQTT_PORT);
  if (client.connect(DEVICE_ID)) {
    Serial.println(" conectado!");
  } else {
    // -2 = broker inacessível: confira o IP, o docker compose e o firewall do Windows (porta 1883).
    Serial.printf(" falhou, estado=%d\n", client.state());
  }
}

int ler_sensor() {
  long soma = 0;
  for (int i = 0; i < amostras; i++) {
    soma += analogRead(PINO_SENSOR);
  }
  return soma / amostras;
}

void setup() {
  Serial.begin(115200);
  pinMode(PINO_LED, OUTPUT);
  digitalWrite(PINO_LED, LOW);

  analogReadResolution(12);                      // 0-4095
  analogSetPinAttenuation(PINO_SENSOR, ADC_11db); // faixa de ~0 a 3,3 V

  conectar_wifi();
  client.setServer(MQTT_SERVER, MQTT_PORT);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(PINO_LED, LOW);
    conectar_wifi();
  }

  if (!client.connected()) {
    digitalWrite(PINO_LED, LOW);
    conectar_mqtt();
    return;
  }
  digitalWrite(PINO_LED, HIGH);
  client.loop();

  if (millis() - ultima_leitura < intervalo_leitura_ms) {
    return;
  }
  ultima_leitura = millis();

  int valor = ler_sensor();

  char mensagem[64];
  snprintf(mensagem, sizeof(mensagem), "{\"device\":\"%s\",\"valor\":%d}", DEVICE_ID, valor);
  client.publish(TOPICO_LEITURA, mensagem);

  Serial.print("Enviado: ");
  Serial.println(mensagem);

  if (valor >= limiar_captura && (ultima_captura == 0 || millis() - ultima_captura >= intervalo_captura_ms)) {
    client.publish(TOPICO_CAPTURA, mensagem);
    ultima_captura = millis();

    Serial.print("Captura solicitada: ");
    Serial.println(mensagem);
  }
}
