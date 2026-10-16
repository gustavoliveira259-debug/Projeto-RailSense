package br.com.railsense_backend.dto.response;

import br.com.railsense_backend.models.Eixo;

public record EixoResponse(
    Long id,
    int posicao,
    String identificadorUnico,
    String numeroUk,
    String nomePatioLinha
) {
    public static EixoResponse from(Eixo e) {
        return new EixoResponse(e.getId(), e.getPosicao(), e.getIdentificadorUnico(),
            e.getVagao().getNumeroUk(), e.getVagao().getPatioLinha().getNome());
    }
}
