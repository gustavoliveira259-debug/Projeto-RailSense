CREATE TABLE analises (
    id BIGSERIAL PRIMARY KEY,
    imagem_atual_id BIGINT REFERENCES imagens(id),
    imagem_baseline_id BIGINT REFERENCES imagens(id),
    score_diferenca REAL,
    limiar_utilizado REAL,
    classificacao VARCHAR(20) CHECK (classificacao IN ('NORMAL', 'SUSPEITO', 'VAZAMENTO')),
    regioes_anomalia JSONB,
    resposta_bruta JSONB,
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);