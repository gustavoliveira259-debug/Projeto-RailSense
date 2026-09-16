-- An alert remains open until it is closed or marked as a false positive.
-- The partial unique index allows alerts for different axles and preserves alert history.
CREATE UNIQUE INDEX uq_alertas_eixo_aberto
    ON alertas (eixo_id)
    WHERE eixo_id IS NOT NULL
      AND status IN ('NOVO', 'EM_ANALISE', 'CONFIRMADO');
