package br.com.railsense_backend.dto.response;

import java.time.Instant;

public record ImagemResponse(
    Long id,
    String urlArquivo,
    Instant timestampCaptura,
    boolean ehBaseline,
    boolean baselineAtiva
) {}