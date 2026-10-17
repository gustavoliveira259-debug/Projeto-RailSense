CREATE TABLE sensores (
    id BIGSERIAL PRIMARY KEY,
    -- Identificador enviado pelo dispositivo no campo "device" da mensagem MQTT.
    codigo VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('VIBRACAO', 'TEMPERATURA')),
    eixo_id BIGINT NOT NULL REFERENCES eixos(id),
    ativo BOOLEAN NOT NULL DEFAULT true,
    ultimo_valor DOUBLE PRECISION,
    ultima_leitura_em TIMESTAMP,
    criado_em TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (codigo, tipo)
);

CREATE TABLE leituras (
    id BIGSERIAL PRIMARY KEY,
    sensor_id BIGINT NOT NULL REFERENCES sensores(id),
    -- Eixo no momento da leitura: o sensor pode ser reinstalado em outro eixo depois.
    eixo_id BIGINT NOT NULL REFERENCES eixos(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('VIBRACAO', 'TEMPERATURA')),
    valor DOUBLE PRECISION NOT NULL,
    registrado_em TIMESTAMP NOT NULL
);

CREATE INDEX idx_leituras_eixo_tipo_data ON leituras (eixo_id, tipo, registrado_em);
CREATE INDEX idx_alertas_eixo ON alertas (eixo_id);
