package br.com.railsense_backend.dto.response;

import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.StatusAlerta;
import java.time.Instant;

public record AlertaResponse(
    Long id,
    NivelAlerta nivel,
    StatusAlerta status,
    Float score,
    Long eixoId,
    String eixoIdentificador,
    Instant criadoEm
) {}