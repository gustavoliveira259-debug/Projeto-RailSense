package br.com.railsense_backend.dto.response;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.enums.StatusOrdem;

/**
 * Números do painel calculados no banco, sobre todos os registros (sem o limite de página).
 * Os mapas trazem todas as chaves do enum, com 0 quando não há registros.
 */
public record PainelResumoResponse(
    Instant geradoEm,
    Map<StatusAlerta, Long> alertasPorStatus,
    /** Alertas EM_ANALISE por nível. */
    Map<NivelAlerta, Long> aguardandoPorNivel,
    Map<StatusOrdem, Long> ordensPorStatus,
    long eixosAtivos,
    long vagoesAtivos,
    /** Um item por dia (no fuso pedido), do mais antigo para hoje, inclusive dias sem alerta. */
    List<AlertasDoDia> alertasPorDia,
    /** Alertas EM_ANALISE, mais graves e mais antigos primeiro. */
    List<AlertaResponse> filaDecisao,
    /** Ordens ABERTA/EM_ANDAMENTO, mais urgentes e mais antigas primeiro. */
    List<OrdemManutencaoResponse> ordensPrioritarias
) {
    public record AlertasDoDia(LocalDate dia, long baixo, long medio, long critico) {}
}
