#include <WiFi.h>
#include <PubSubClient.h>

#include "secrets.h"  // WIFI_SSID, WIFI_PASSWORD, MQTT_SERVER, MQTT_PORT (veja include/secrets.example.h)

// Módulo piezoelétrico de vibração na placa de expansão: S -> GPIO34, + -> V (3V3), - -> G.
// Precisa ser um pino do ADC1 (GPIO32-39): o ADC2 (ex.: GPIO14) não lê com o Wi-Fi ligado.
// GPIO34 é só entrada e não tem pull-up, ideal para sinal analógico.
#define PINO_SENSOR 34
// LED azul da ESP32 DevKit: aceso = conectado ao broker.
#define PINO_LED 2

#define DEVICE_ID "esp32-01"
#define TOPICO_LEITURA "railsense/sensor/vibracao"
#define TOPICO_CAPTURA "railsense/camera/capturar"

// O módulo piezoelétrico só gera tensão no instante do impacto (fica em 0 parado).
// Por isso o sensor é amostrado sem parar e, a cada janela, publicamos as métricas
// usadas em análise de vibração de rolamentos: pico, RMS e número de impactos.
const unsigned long periodo_amostra_us = 500;    // 2 kHz
const unsigned long janela_ms = 1000;
// Acima deste nível (0-4095) uma amostra conta como impacto (com histerese para não contar o mesmo duas vezes).
const int limiar_impacto = 200;
const int histerese_impacto = 50;
// Se o pico da janela passar deste valor, o ESP pede uma foto ao celular (topico railsense/camera/capturar).
// Calibre batendo no sensor e olhando o "pico" no Serial.
const int limiar_captura = 2000;
// Intervalo minimo entre dois pedidos de captura, para nao inundar o backend.
const unsigned long intervalo_captura_ms = 10000;

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long inicio_janela = 0;
unsigned long ultima_amostra_us = 0;
unsigned long ultima_captura = 0;
unsigned long ultima_tentativa_mqtt = 0;

// Acumuladores da janela atual.
int pico = 0;
double soma_quadrados = 0;
unsigned long total_amostras = 0;
int impactos = 0;
bool em_impacto = false;

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

void amostrar() {
  int valor = analogRead(PINO_SENSOR);

  if (valor > pico) {
    pico = valor;
  }
  soma_quadrados += (double)valor * valor;
  total_amostras++;

  if (!em_impacto && valor >= limiar_impacto) {
    em_impacto = true;
    impactos++;
  } else if (em_impacto && valor < limiar_impacto - histerese_impacto) {
    em_impacto = false;
  }
}

void publicar_janela() {
  int rms = total_amostras > 0 ? (int)sqrt(soma_quadrados / total_amostras) : 0;

  char mensagem[96];
  snprintf(mensagem, sizeof(mensagem),
           "{\"device\":\"%s\",\"valor\":%d,\"rms\":%d,\"impactos\":%d}",
           DEVICE_ID, pico, rms, impactos);
  client.publish(TOPICO_LEITURA, mensagem);

  Serial.print("Enviado: ");
  Serial.println(mensagem);

  if (pico >= limiar_captura && (ultima_captura == 0 || millis() - ultima_captura >= intervalo_captura_ms)) {
    client.publish(TOPICO_CAPTURA, mensagem);
    ultima_captura = millis();

    Serial.print("Captura solicitada: ");
    Serial.println(mensagem);
  }

  pico = 0;
  soma_quadrados = 0;
  total_amostras = 0;
  impactos = 0;
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

  if (micros() - ultima_amostra_us >= periodo_amostra_us) {
    ultima_amostra_us = micros();
    amostrar();
  }

  if (millis() - inicio_janela >= janela_ms) {
    inicio_janela = millis();
    publicar_janela();
  }
}
