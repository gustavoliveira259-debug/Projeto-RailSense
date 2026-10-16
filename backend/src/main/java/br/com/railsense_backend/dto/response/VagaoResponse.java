package br.com.railsense_backend.dto.response;

import br.com.railsense_backend.models.Vagao;

public record VagaoResponse(
    Long id,
    String numeroUk,
    String tipo,
    Long patioLinhaId,
    String nomePatioLinha,
    boolean ativo
) {
    public static VagaoResponse from(Vagao v) {
        return new VagaoResponse(v.getId(), v.getNumeroUk(), v.getTipo(),
            v.getPatioLinha().getId(), v.getPatioLinha().getNome(), v.isAtivo());
    }
}
