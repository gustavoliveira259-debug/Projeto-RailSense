package br.com.railsense_backend.dto.response;

import java.time.Instant;

import br.com.railsense_backend.enums.DecisaoTipo;
import br.com.railsense_backend.models.DecisaoAlerta;

public record DecisaoAlertaResponse(
    Long id,
    Long alertaId,
    DecisaoTipo decisao,
    String motivo,
    Long usuarioId,
    String usuarioNome,
    Instant criadoEm
) {
    public static DecisaoAlertaResponse from(DecisaoAlerta d) {
        return new DecisaoAlertaResponse(d.getId(), d.getAlerta().getId(), d.getDecisao(), d.getMotivo(),
            d.getUsuario().getId(), d.getUsuario().getNome(), d.getCriadoEm());
    }
}
