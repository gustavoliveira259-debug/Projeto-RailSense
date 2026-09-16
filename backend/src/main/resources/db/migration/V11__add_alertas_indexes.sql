CREATE INDEX idx_alertas_status_nivel_criado_em
    ON alertas (status, nivel, criado_em DESC);

CREATE INDEX idx_alertas_eixo_id
    ON alertas (eixo_id);

CREATE INDEX idx_alertas_analise_id
    ON alertas (analise_id);

CREATE INDEX idx_eixos_vagao_id
    ON eixos (vagao_id);
