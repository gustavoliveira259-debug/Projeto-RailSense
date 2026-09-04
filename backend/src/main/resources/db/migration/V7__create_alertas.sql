CREATE TABLE alertas (
    id BIGSERIAL PRIMARY KEY,
    analise_id BIGINT REFERENCES analises(id),
    eixo_id BIGINT REFERENCES eixos(id),
    nivel VARCHAR(10) NOT NULL CHECK (nivel IN ('BAIXO', 'MEDIO', 'CRITICO')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('NOVO', 'EM_ANALISE', 'CONFIRMADO', 'FALSO_POSITIVO', 'FECHADO')),
    score REAL,
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);