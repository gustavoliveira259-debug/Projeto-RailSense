-- Vincula o dispositivo MQTT (campo "device" da mensagem do ESP32) a um eixo.
ALTER TABLE eixos ADD COLUMN sensor_dispositivo VARCHAR(64) UNIQUE;

-- Leituras do tópico railsense/sensor/vibracao (cerca de 1 por segundo por dispositivo).
-- Leituras antigas são apagadas pelo VibracaoService (app.vibracao.retencao-dias).
CREATE TABLE leituras_vibracao (
    id BIGSERIAL PRIMARY KEY,
    eixo_id BIGINT NOT NULL REFERENCES eixos(id),
    dispositivo VARCHAR(64) NOT NULL,
    valor INTEGER NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_leituras_vibracao_eixo_criado_em ON leituras_vibracao (eixo_id, criado_em);
CREATE INDEX idx_leituras_vibracao_criado_em ON leituras_vibracao (criado_em);
