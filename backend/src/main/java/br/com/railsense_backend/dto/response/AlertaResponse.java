package br.com.railsense_backend.dto.response;

import java.time.Instant;

import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.StatusAlerta;

public record AlertaResponse(
    Long id,
    NivelAlerta nivel,
    StatusAlerta status,
    Float score,
    Long eixoId,
    String eixoIdentificador,
    Instant criadoEm
) {}