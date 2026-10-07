package br.com.railsense_backend.dto.response;

public record EixoResponse(
    Long id,
    int posicao,
    String identificadorUnico,
    String numeroUk,
    String nomePatioLinha
) {}