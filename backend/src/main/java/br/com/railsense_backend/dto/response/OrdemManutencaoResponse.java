package br.com.railsense_backend.dto.response;

import java.time.Instant;

import br.com.railsense_backend.enums.Prioridade;
import br.com.railsense_backend.enums.StatusOrdem;
import br.com.railsense_backend.models.OrdemManutencao;

public record OrdemManutencaoResponse(
    Long id,
    Long alertaId,
    Long eixoId,
    String eixoIdentificador,
    String titulo,
    Prioridade prioridade,
    StatusOrdem status,
    Long criadoPorId,
    String criadoPorNome,
    Instant criadoEm
) {
    public static OrdemManutencaoResponse from(OrdemManutencao o) {
        return new OrdemManutencaoResponse(o.getId(), o.getAlerta().getId(), o.getEixo().getId(),
            o.getEixo().getIdentificadorUnico(), o.getTitulo(), o.getPrioridade(), o.getStatus(),
            o.getCriadoPor().getId(), o.getCriadoPor().getNome(), o.getCriadoEm());
    }
}
