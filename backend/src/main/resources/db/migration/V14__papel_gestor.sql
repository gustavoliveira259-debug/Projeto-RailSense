-- GESTOR: cadastros da frota, baseline, decisão de alertas e abertura/cancelamento de ordens.
-- ENGENHEIRO passa a só visualizar e atender ordens; quem cadastra precisa ser promovido pelo ADMIN.
ALTER TABLE usuarios DROP CONSTRAINT usuarios_papel_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_papel_check
    CHECK (papel IN ('ENGENHEIRO', 'GESTOR', 'ADMIN'));
