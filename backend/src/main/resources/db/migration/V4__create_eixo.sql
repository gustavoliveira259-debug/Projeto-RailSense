CREATE TABLE eixos (
    id BIGSERIAL PRIMARY KEY,
    vagao_id BIGINT REFERENCES vagoes(id),
    posicao INTEGER NOT NULL,
    identificador_unico VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);