#include <WiFi.h>
#include <PubSubClient.h>

#define ssid "linksys"
#define password ""

// Sinal do modulo do piezo. Precisa ser ADC1 (GPIO 32-39): o ADC2 nao le com Wi-Fi ligado.
#define sensor 34
// Alimenta o modulo (VCC) com 3,3 V: deste lado da placa nao ha pino 3V3.
#define alimentacao_sensor 33

// Amostras lidas por envio (~2000/s). O valor enviado e o RMS dessas amostras.
const int amostras = 2000;
const int intervalo_amostra_us = 500;

WiFiClient espClient;
PubSubClient client(espClient);

const char* mqtt_server = "10.110.12.99";
const int mqtt_port = 1884;

// RMS a partir do qual o ESP pede uma foto ao celular (topico railsense/camera/capturar).
// Calibrar: deixar acima do valor do rolamento bom com o motor ligado.
const int limiar_captura = 200;
// Intervalo minimo entre dois pedidos de captura, para nao inundar o backend.
const unsigned long intervalo_captura_ms = 10000;
unsigned long ultima_captura = 0;

void setup_wifi() {
  delay(10);

  Serial.println("Conectando ao Wi-Fi...");

  WiFi.mode(WIFI_STA);
  // Potencia menor = pico de corrente menor ao ligar o radio (evita queda da alimentacao pelo USB).
  WiFi.setTxPower(WIFI_POWER_15dBm);

  // DIAGNOSTICO TEMPORARIO: lista as redes visiveis e o sinal (RSSI em dBm).
  int redes = WiFi.scanNetworks();
  for (int i = 0; i < redes; i++) {
    Serial.printf("rede: %s  sinal: %d dBm  canal: %d\n", WiFi.SSID(i).c_str(), WiFi.RSSI(i), WiFi.channel(i));
  }

  WiFi.begin(ssid, password);

  // Imprime o status enquanto espera: 1 = rede nao encontrada, 4 = falha (senha), 6 = desconectado.
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(WiFi.status());
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

// Le o sensor por ~1 s e devolve o RMS sem a componente continua.
// Parado fica perto de 0 (sobra so o ruido do ADC, poucas dezenas).
// Rolamento bom fica baixo e estavel; desgaste aumenta a intensidade.
int ler_vibracao_rms() {
  double soma = 0;
  double soma_quadrados = 0;

  for (int i = 0; i < amostras; i++) {
    int leitura = analogRead(sensor);
    soma += leitura;
    soma_quadrados += (double)leitura * leitura;
    delayMicroseconds(intervalo_amostra_us);
  }

  double media = soma / amostras;
  double variancia = soma_quadrados / amostras - media * media;
  return variancia > 0 ? (int)sqrt(variancia) : 0;
}

void setup() {
  Serial.begin(115200);

  pinMode(alimentacao_sensor, OUTPUT);
  digitalWrite(alimentacao_sensor, HIGH);
  analogSetPinAttenuation(sensor, ADC_11db);  // faixa de 0 a ~3,3 V

  setup_wifi();

  client.setServer(mqtt_server, mqtt_port);
}

void loop() {

  if (!client.connected()) {
    reconnect();
  }

  client.loop();

  int valor = ler_vibracao_rms();

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
}