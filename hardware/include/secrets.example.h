// Copie para include/secrets.h (não versionado) e preencha com os dados da sua rede.
#pragma once

// Rede Wi-Fi 2.4 GHz (a ESP32 não conecta em 5 GHz). Rede aberta: senha "".
#define WIFI_SSID "nome-da-rede"
#define WIFI_PASSWORD "senha-da-rede"

// ---- Opção A: broker na nuvem (EMQX Cloud Serverless), acessível de qualquer rede com internet ----
// Endereço do deployment (sem "mqtts://" e sem porta), porta 8883 (TLS) e o usuário criado em
// Access Control -> Authentication no console do EMQX Cloud. Passo a passo em mqtt/topics.md.
// #define MQTT_SERVER "xxxxxxxx.ala.us-east-1.emqxsl.com"
// #define MQTT_PORT 8883
// #define MQTT_USER "railsense-esp32"
// #define MQTT_PASSWORD "senha-do-usuario"

// ---- Opção B: broker local (PC na mesma rede da ESP32) ----
// IP do PC que roda o broker. Ele muda de tempos em tempos:
// rode hardware/broker-local.ps1, que mostra o IP atual e avisa se este estiver errado.
// Não use 192.168.56.x (VirtualBox) nem 172.x (WSL/Docker): a ESP32 não alcança.
//#define MQTT_SERVER "192.168.0.10"
// 1883 é o padrão. Use 1884 se o PC já tiver o serviço Mosquitto do Windows ocupando a 1883.
//#define MQTT_PORT 1883
// O broker local aceita conexão sem login: deixe vazio.
//#define MQTT_USER ""
//#define MQTT_PASSWORD ""

// O TLS liga sozinho com MQTT_PORT 8883. Descomente para forçar (1 = TLS, 0 = sem TLS).
// #define MQTT_TLS 1
