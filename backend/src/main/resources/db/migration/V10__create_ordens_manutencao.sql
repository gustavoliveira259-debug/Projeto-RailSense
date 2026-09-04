CREATE TABLE ordens_manutencao (
    id BIGSERIAL PRIMARY KEY,
    alerta_id BIGINT REFERENCES alertas(id),
    eixo_id BIGINT REFERENCES eixos(id),
    titulo VARCHAR(255) NOT NULL,
    prioridade VARCHAR(10) NOT NULL CHECK (prioridade IN ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA')),
    criado_por_usuario_id BIGINT REFERENCES usuarios(id),
    criado_em TIMESTAMP NOT NULL DEFAULT now()
);