package br.com.railsense_backend.dto.response;

import java.time.Instant;

import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.models.Alerta;

public record AlertaResponse(
    Long id,
    NivelAlerta nivel,
    StatusAlerta status,
    Float score,
    Long eixoId,
    String eixoIdentificador,
    Instant criadoEm
) {
    public static AlertaResponse from(Alerta a) {
        return new AlertaResponse(a.getId(), a.getNivel(), a.getStatus(), a.getScore(),
            a.getEixo().getId(), a.getEixo().getIdentificadorUnico(), a.getCriadoEm());
    }
}