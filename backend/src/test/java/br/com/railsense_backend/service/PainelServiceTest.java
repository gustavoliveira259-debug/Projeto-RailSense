package br.com.railsense_backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.enums.StatusOrdem;
import br.com.railsense_backend.repository.AlertaRepository;
import br.com.railsense_backend.repository.EixoRepository;
import br.com.railsense_backend.repository.OrdemManutencaoRepository;
import br.com.railsense_backend.repository.VagaoRepository;

@ExtendWith(MockitoExtension.class)
class PainelServiceTest {

    static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");

    @Mock AlertaRepository alertas;
    @Mock OrdemManutencaoRepository ordens;
    @Mock EixoRepository eixos;
    @Mock VagaoRepository vagoes;
    @InjectMocks PainelService service;

    @Test
    void preencheZerosEAgrupaPorDiaNoFusoPedido() {
        // 30/10 às 12h em São Paulo.
        Instant agora = Instant.parse("2026-10-30T15:00:00Z");
        when(alertas.contarPorStatus()).thenReturn(List.<Object[]>of(new Object[] {StatusAlerta.EM_ANALISE, 5L}));
        when(alertas.contarPorNivel(StatusAlerta.EM_ANALISE))
            .thenReturn(List.<Object[]>of(new Object[] {NivelAlerta.CRITICO, 2L}));
        when(ordens.contarPorStatus()).thenReturn(List.of());
        when(eixos.countByAtivoTrue()).thenReturn(32L);
        when(vagoes.countByAtivoTrue()).thenReturn(8L);
        when(alertas.listarCriadoEmENivelDesde(any())).thenReturn(List.of(
            // 30/10 01:00 UTC = 29/10 22:00 em São Paulo: conta no dia 29, não no 30.
            new Object[] {Instant.parse("2026-10-30T01:00:00Z"), NivelAlerta.CRITICO},
            new Object[] {Instant.parse("2026-10-30T14:00:00Z"), NivelAlerta.BAIXO},
            new Object[] {Instant.parse("2026-10-30T14:30:00Z"), NivelAlerta.BAIXO}));
        when(alertas.findPorGravidade(any(), any())).thenReturn(List.of());
        when(ordens.findPorPrioridade(any(), any())).thenReturn(List.of());

        var resumo = service.resumo(SAO_PAULO, agora);

        assertThat(resumo.alertasPorStatus())
            .containsEntry(StatusAlerta.EM_ANALISE, 5L)
            .containsEntry(StatusAlerta.FECHADO, 0L)
            .hasSize(StatusAlerta.values().length);
        assertThat(resumo.aguardandoPorNivel())
            .containsEntry(NivelAlerta.CRITICO, 2L)
            .containsEntry(NivelAlerta.BAIXO, 0L);
        assertThat(resumo.ordensPorStatus()).containsEntry(StatusOrdem.ABERTA, 0L);
        assertThat(resumo.eixosAtivos()).isEqualTo(32L);

        var dias = resumo.alertasPorDia();
        assertThat(dias).hasSize(PainelService.DIAS);
        assertThat(dias.getFirst().dia()).isEqualTo(LocalDate.of(2026, 10, 17));
        assertThat(dias.getLast().dia()).isEqualTo(LocalDate.of(2026, 10, 30));
        assertThat(dias.getLast().baixo()).isEqualTo(2);
        assertThat(dias.getLast().critico()).isZero();
        assertThat(dias.get(dias.size() - 2).critico()).isEqualTo(1);
    }
}
