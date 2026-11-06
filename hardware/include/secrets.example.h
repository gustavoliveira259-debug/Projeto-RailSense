// Copie para include/secrets.h (não versionado) e preencha com os dados da sua rede.
#pragma once

// Rede Wi-Fi 2.4 GHz (a ESP32 não conecta em 5 GHz).
#define WIFI_SSID "nome-da-rede"
#define WIFI_PASSWORD "senha-da-rede"

// IP do PC que roda o broker (docker compose), na MESMA rede Wi-Fi da ESP32.
// No Windows: ipconfig -> "Endereço IPv4" do adaptador Wi-Fi/Ethernet da rede local.
// Não use 192.168.56.x: é o adaptador do VirtualBox, a ESP32 não alcança.
#define MQTT_SERVER "192.168.0.10"
#define MQTT_PORT 1883
