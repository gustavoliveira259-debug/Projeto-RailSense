package br.com.railsense_backend.dto.response;

import br.com.railsense_backend.enums.TipoEvidencia;
import br.com.railsense_backend.models.EvidenciaAlerta;

public record EvidenciaResponse(
    TipoEvidencia tipo,
    Long imagemId,
    String urlArquivo
) {
    public static EvidenciaResponse from(EvidenciaAlerta e) {
        return new EvidenciaResponse(e.getTipo(), e.getImagem().getId(), e.getImagem().getUrlArquivo());
    }
}
