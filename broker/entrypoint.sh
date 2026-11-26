#!/bin/sh
# Gera o arquivo de senhas do Mosquitto a partir das variáveis do .env e sobe o broker.
# Sem uma das senhas o broker não sobe: melhor falhar do que ficar aberto.
set -eu

for var in MQTT_ESP32_SENHA MQTT_BACKEND_SENHA MQTT_CAMERA_SENHA; do
  eval "valor=\${$var:-}"
  if [ -z "$valor" ]; then
    echo "broker: defina $var no .env (veja .env.example)" >&2
    exit 1
  fi
done

arquivo=/mosquitto/passwd
rm -f "$arquivo"
mosquitto_passwd -c -b "$arquivo" esp32 "$MQTT_ESP32_SENHA"
mosquitto_passwd -b "$arquivo" backend "$MQTT_BACKEND_SENHA"
mosquitto_passwd -b "$arquivo" camera "$MQTT_CAMERA_SENHA"
chown mosquitto:mosquitto "$arquivo"
chmod 0600 "$arquivo"

# O acl montado do host não pertence ao usuário mosquitto, e versões novas recusam carregar
# arquivos assim: usa uma cópia com o dono certo.
cp /mosquitto/config/acl /mosquitto/acl
chown mosquitto:mosquitto /mosquitto/acl
chmod 0600 /mosquitto/acl

exec /docker-entrypoint.sh mosquitto -c /mosquitto/config/mosquitto.conf
