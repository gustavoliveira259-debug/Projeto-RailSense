CREATE TABLE trens (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(255),
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);

-- Vagões passam a pertencer a um trem (composição). Pátio/linha continua como localização opcional.
ALTER TABLE vagoes ADD COLUMN trem_id BIGINT REFERENCES trens(id);
CREATE INDEX idx_vagoes_trem ON vagoes (trem_id);
