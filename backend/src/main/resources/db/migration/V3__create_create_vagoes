CREATE TABLE vagoes (
    id BIGSERIAL PRIMARY KEY,
    numero_uk VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(100),
    patio_linha_id BIGINT REFERENCES patios_linhas(id),
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);