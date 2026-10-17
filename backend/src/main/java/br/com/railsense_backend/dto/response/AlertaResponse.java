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
    Long vagaoId,
    String numeroUk,
    Long tremId,
    String tremCodigo,
    Instant criadoEm
) {
    public static AlertaResponse from(Alerta a) {
        var eixo = a.getEixo();
        var vagao = eixo.getVagao();
        var trem = vagao != null ? vagao.getTrem() : null;
        return new AlertaResponse(a.getId(), a.getNivel(), a.getStatus(), a.getScore(),
            eixo.getId(), eixo.getIdentificadorUnico(),
            vagao != null ? vagao.getId() : null, vagao != null ? vagao.getNumeroUk() : null,
            trem != null ? trem.getId() : null, trem != null ? trem.getCodigo() : null,
            a.getCriadoEm());
    }
}
