-- O papel GERENTE deixa de existir: quem o tinha passa a ENGENHEIRO.
UPDATE usuarios SET papel = 'ENGENHEIRO' WHERE papel = 'GERENTE';

ALTER TABLE usuarios DROP CONSTRAINT usuarios_papel_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_papel_check
    CHECK (papel IN ('ENGENHEIRO', 'ADMIN'));
