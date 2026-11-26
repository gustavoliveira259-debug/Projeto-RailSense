package br.com.railsense_backend.dto.response;

import br.com.railsense_backend.models.Eixo;

public record EixoResponse(
    Long id,
    int posicao,
    String identificadorUnico,
    Long vagaoId,
    String numeroUk,
    String nomePatioLinha,
    boolean ativo,
    String sensorDispositivo
) {
    public static EixoResponse from(Eixo e) {
        return new EixoResponse(e.getId(), e.getPosicao(), e.getIdentificadorUnico(),
            e.getVagao().getId(), e.getVagao().getNumeroUk(), e.getVagao().getPatioLinha().getNome(), e.isAtivo(),
            e.getSensorDispositivo());
    }
}
