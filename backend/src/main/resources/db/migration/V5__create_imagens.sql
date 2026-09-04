CREATE TABLE imagens (
    id BIGSERIAL PRIMARY KEY,
    eixo_id BIGINT REFERENCES eixos(id),
    url_arquivo VARCHAR(500) NOT NULL,
    public_id VARCHAR(255),
    timestamp_captura TIMESTAMP,
    eh_baseline BOOLEAN NOT NULL DEFAULT false,
    baseline_ativa BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_baseline_ativa_unica
    ON imagens (eixo_id)
    WHERE baseline_ativa = true;