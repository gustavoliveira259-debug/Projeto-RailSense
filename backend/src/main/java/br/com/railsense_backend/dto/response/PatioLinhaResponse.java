package br.com.railsense_backend.dto.response;

import br.com.railsense_backend.enums.TipoPatioLinha;
import br.com.railsense_backend.models.PatioLinha;

public record PatioLinhaResponse(
    Long id,
    String nome,
    TipoPatioLinha tipo,
    boolean ativo
) {
    public static PatioLinhaResponse from(PatioLinha p) {
        return new PatioLinhaResponse(p.getId(), p.getNome(), p.getTipo(), p.isAtivo());
    }
}
