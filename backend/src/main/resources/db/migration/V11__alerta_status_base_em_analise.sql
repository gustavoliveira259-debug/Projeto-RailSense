-- Todo alerta nasce EM_ANALISE (aguardando decisão humana); o status NOVO deixa de existir.
UPDATE alertas SET status = 'EM_ANALISE' WHERE status = 'NOVO';

ALTER TABLE alertas DROP CONSTRAINT alertas_status_check;
ALTER TABLE alertas ADD CONSTRAINT alertas_status_check
    CHECK (status IN ('EM_ANALISE', 'CONFIRMADO', 'FALSO_POSITIVO', 'FECHADO'));
ALTER TABLE alertas ALTER COLUMN status SET DEFAULT 'EM_ANALISE';
