CREATE TABLE decisoes_alerta (
    id BIGSERIAL PRIMARY KEY,
    alerta_id BIGINT REFERENCES alertas(id),
    usuario_id BIGINT REFERENCES usuarios(id),
    decisao VARCHAR(20) NOT NULL CHECK (decisao IN ('CONFIRMADO', 'FALSO_POSITIVO')),
    motivo TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);