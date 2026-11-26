// Copie para include/secrets.h (não versionado) e preencha com os dados da sua rede.
#pragma once

// Rede Wi-Fi 2.4 GHz (a ESP32 não conecta em 5 GHz). Rede aberta: senha "".
#define WIFI_SSID "nome-da-rede"
#define WIFI_PASSWORD "senha-da-rede"

// IP do PC que roda o broker, na mesma rede da ESP32. Ele muda de tempos em tempos:
// rode hardware/broker-local.ps1, que mostra o IP atual e avisa se este estiver errado.
// Não use 192.168.56.x (VirtualBox) nem 172.x (WSL/Docker): a ESP32 não alcança.
#define MQTT_SERVER "192.168.0.10"
// 1883 é o padrão. Use 1884 se o PC já tiver o serviço Mosquitto do Windows ocupando a 1883.
#define MQTT_PORT 1883

// O broker não aceita conexão anônima. Usuário esp32 e a MQTT_ESP32_SENHA do .env da raiz.
#define MQTT_USER "esp32"
#define MQTT_PASSWORD "senha-do-broker"
