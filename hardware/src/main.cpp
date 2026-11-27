// Firmware do sensor de vibração do RailSense.
//
// Dois modos, escolhidos pelo ambiente do PlatformIO (hardware/platformio.ini):
//   esp32dev      Wi-Fi + MQTT: publica direto no broker (local ou na nuvem com TLS).
//   esp32dev-usb  USB: escreve as mensagens na serial e hardware/serial_bridge.py
//                 publica no broker. Não precisa de Wi-Fi.
// Nos dois modos as mensagens e os tópicos são os mesmos (mqtt/topics.md).

#include <Arduino.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

#ifndef RAILSENSE_USB
#include <WiFi.h>
#include <PubSubClient.h>

#if !__has_include("secrets.h")
#error "Falta hardware/include/secrets.h: copie include/secrets.example.h para include/secrets.h e preencha."
#endif
#include "secrets.h"  // WIFI_SSID, WIFI_PASSWORD, MQTT_SERVER, MQTT_PORT (veja include/secrets.example.h)

// Campos novos do secrets.h. Os padrões mantêm um secrets.h antigo (broker local, sem senha) funcionando.
#ifndef MQTT_USER
#define MQTT_USER ""
#endif
#ifndef MQTT_PASSWORD
#define MQTT_PASSWORD ""
#endif
// TLS liga sozinho na porta 8883 (broker na nuvem); defina 0 ou 1 no secrets.h para forçar.
#ifndef MQTT_TLS
#define MQTT_TLS (MQTT_PORT == 8883)
#endif

#if MQTT_TLS
#include <WiFiClientSecure.h>
#include "ca_cert.h"  // MQTT_CA_CERT
#endif
#endif

// Módulo piezoelétrico de vibração na placa de expansão: S -> GPIO34, + -> V (3V3), - -> G.
// Precisa ser um pino do ADC1 (GPIO32-39): o ADC2 (ex.: GPIO14) não lê com o Wi-Fi ligado.
// GPIO34 é só entrada e não tem pull-up, ideal para sinal analógico.
#define PINO_SENSOR 34
// LED azul da ESP32 DevKit: aceso = conectado ao broker (no modo USB fica sempre aceso).
#define PINO_LED 2

// Mesmo valor do campo "Sensor de vibração" do eixo em Cadastros.
#define DEVICE_ID "esp32-01"

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

unsigned long inicio_janela = 0;
unsigned long ultima_amostra_us = 0;
unsigned long ultima_captura = 0;

// Acumuladores da janela atual.
int pico = 0;
double soma_quadrados = 0;
unsigned long total_amostras = 0;
int impactos = 0;
bool em_impacto = false;

#ifdef RAILSENSE_USB

// Uma linha por mensagem: "<prefixo> <json>". O prefixo diz à ponte em qual tópico publicar:
// VIB -> railsense/sensor/vibracao, CAP -> railsense/camera/capturar. Outras linhas são só log.
void publicar(const char* prefixo, const char* mensagem) {
  Serial.print(prefixo);
  Serial.print(' ');
  Serial.println(mensagem);
}

// No modo USB não há conexão a manter: a ponte serial cuida do broker.
bool manter_conexao() {
  return true;
}

void iniciar_conexao() {
  Serial.println("RailSense: modo USB, mensagens pela serial");
}

#else

#if MQTT_TLS
WiFiClientSecure espClient;
#else
WiFiClient espClient;
#endif
PubSubClient client(espClient);

unsigned long ultima_tentativa_mqtt = 0;

// Potência do rádio, da menor para a maior. Na potência máxima o pico de corrente derrubava
// a placa pelo USB (a COM some e volta em loop logo após "Conectando ao Wi-Fi"); potência
// baixa demais às vezes não alcança o roteador. Começa baixo e só sobe se não conectar.
// 8,5 dBm alcança um roteador na mesma sala e quase não puxa corrente; 17 dBm ficou de fora
// porque é a faixa que derrubava a placa.
const wifi_power_t potencias_wifi[] = {WIFI_POWER_8_5dBm, WIFI_POWER_11dBm, WIFI_POWER_15dBm};
const unsigned long tempo_por_potencia_ms = 8000;

void conectar_wifi() {
  WiFi.mode(WIFI_STA);

  for (wifi_power_t potencia : potencias_wifi) {
    Serial.printf("Conectando ao Wi-Fi %s (potencia %.1f dBm)", WIFI_SSID, potencia / 4.0);
    WiFi.disconnect();
    // Aplicada antes e depois do begin: em algumas versões do core ela só vale com o rádio já iniciado.
    WiFi.setTxPower(potencia);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    WiFi.setTxPower(potencia);

    unsigned long inicio = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - inicio < tempo_por_potencia_ms) {
      delay(500);
      Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.printf("\nWi-Fi conectado! IP %s\n", WiFi.localIP().toString().c_str());
      return;
    }
    Serial.println();
  }

  Serial.println("Wi-Fi nao conectou (roteador ligado? rede 2.4 GHz? senha certa?). Reiniciando...");
  ESP.restart();
}

// Tenta conectar ao broker sem travar o loop: no máximo uma tentativa a cada 5 s.
void conectar_mqtt() {
  if (millis() - ultima_tentativa_mqtt < 5000 && ultima_tentativa_mqtt != 0) {
    return;
  }
  ultima_tentativa_mqtt = millis();

  Serial.printf("Conectando ao MQTT %s:%d%s...", MQTT_SERVER, MQTT_PORT, MQTT_TLS ? " (TLS)" : "");
  // Sem usuário configurado o login vai sem credenciais, como o broker local espera.
  const char* usuario = strlen(MQTT_USER) > 0 ? MQTT_USER : nullptr;
  const char* senha = usuario != nullptr ? MQTT_PASSWORD : nullptr;
  if (client.connect(DEVICE_ID, usuario, senha)) {
    Serial.println(" conectado!");
  } else {
    Serial.printf(" falhou, estado=%d\n", client.state());
    if (client.state() == MQTT_CONNECT_BAD_CREDENTIALS || client.state() == MQTT_CONNECT_UNAUTHORIZED) {
      Serial.println("  Broker recusou o login: confira MQTT_USER e MQTT_PASSWORD em include/secrets.h.");
    } else if (client.state() == MQTT_CONNECT_FAILED) {
#if MQTT_TLS
      // -2 com TLS: endereço errado, rede bloqueando a porta ou certificado que não confere.
      Serial.println("  Broker inacessivel: confira MQTT_SERVER (endereco do broker, sem mqtts://) e MQTT_PORT.");
      Serial.println("  Se a rede bloquear a porta 8883 (comum em redes de escola), teste com o roteador do celular.");
      Serial.println("  Se o endereco estiver certo, pode ser o certificado: veja include/ca_cert.h.");
#else
      // -2: ninguém respondeu nesse IP/porta. O caso mais comum é o IP do PC do broker ter mudado.
      Serial.println("  Broker inacessivel: no PC do broker rode hardware/broker-local.ps1, ele mostra o IP atual");
      Serial.println("  e avisa se MQTT_SERVER em include/secrets.h estiver desatualizado.");
#endif
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

// Garante Wi-Fi e broker. Devolve false enquanto o broker não estiver conectado.
bool manter_conexao() {
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(PINO_LED, LOW);
    conectar_wifi();
  }

  if (!client.connected()) {
    digitalWrite(PINO_LED, LOW);
    conectar_mqtt();
    return false;
  }
  digitalWrite(PINO_LED, HIGH);
  client.loop();
  return true;
}

void iniciar_conexao() {
  conectar_wifi();
#if MQTT_TLS
  // Confere o certificado do broker; o nome do host vai no SNI, que brokers na nuvem exigem.
  espClient.setCACert(MQTT_CA_CERT);
#endif
  client.setServer(MQTT_SERVER, MQTT_PORT);
}

#endif

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
  publicar("VIB", mensagem);

  if (pico >= limiar_captura && (ultima_captura == 0 || millis() - ultima_captura >= intervalo_captura_ms)) {
    publicar("CAP", mensagem);
    ultima_captura = millis();
  }

  pico = 0;
  soma_quadrados = 0;
  total_amostras = 0;
  impactos = 0;
}

void setup() {
  // Alimentação pelo USB: o rádio do Wi-Fi puxa picos de ~300 mA ao ligar, a tensão cai e
  // o detector de brownout reinicia a placa em loop (a COM some e volta). Por isso:
  //  - o detector é desligado: uma queda curta não reinicia mais a placa;
  //  - a CPU roda a 80 MHz em vez de 240 MHz (sobra folga para amostrar a 2 kHz e para o TLS);
  //  - espera 1 s antes do Wi-Fi para a tensão do USB se estabilizar.
  // Se mesmo assim a COM sumir, o problema é o cabo ou a porta USB (use porta direto no PC).
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  setCpuFrequencyMhz(80);

  Serial.begin(115200);
  delay(1000);
  pinMode(PINO_LED, OUTPUT);
#ifdef RAILSENSE_USB
  digitalWrite(PINO_LED, HIGH);
#else
  digitalWrite(PINO_LED, LOW);
#endif

  analogReadResolution(12);                      // 0-4095
  analogSetPinAttenuation(PINO_SENSOR, ADC_11db); // faixa de ~0 a 3,3 V

  iniciar_conexao();
}

void loop() {
  if (!manter_conexao()) {
    return;
  }

  if (micros() - ultima_amostra_us >= periodo_amostra_us) {
    ultima_amostra_us = micros();
    amostrar();
  }

  if (millis() - inicio_janela >= janela_ms) {
    inicio_janela = millis();
    publicar_janela();
  }
}
