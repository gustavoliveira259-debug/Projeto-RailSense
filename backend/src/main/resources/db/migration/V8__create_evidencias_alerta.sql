CREATE TABLE evidencias_alerta (
    id BIGSERIAL PRIMARY KEY,
    alerta_id BIGINT NOT NULL REFERENCES alertas(id),
    imagem_id BIGINT NOT NULL REFERENCES imagens(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('BASELINE', 'ATUAL', 'HEATMAP')),
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);
