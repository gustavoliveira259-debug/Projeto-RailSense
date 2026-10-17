package br.com.railsense_backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import br.com.railsense_backend.dto.request.OrdemManutencaoRequest;
import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.Prioridade;
import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.enums.StatusOrdem;
import br.com.railsense_backend.exception.RegraNegocioException;
import br.com.railsense_backend.models.Alerta;
import br.com.railsense_backend.models.Eixo;
import br.com.railsense_backend.models.OrdemManutencao;
import br.com.railsense_backend.models.Usuario;
import br.com.railsense_backend.repository.AlertaRepository;
import br.com.railsense_backend.repository.OrdemManutencaoRepository;
import br.com.railsense_backend.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class OrdemManutencaoServiceTest {

    @Mock OrdemManutencaoRepository ordens;
    @Mock AlertaRepository alertas;
    @Mock UsuarioRepository usuarios;

    OrdemManutencaoService service;

    @BeforeEach
    void setUp() {
        service = new OrdemManutencaoService(ordens, alertas, usuarios);
    }

    private static Alerta alerta(StatusAlerta status, NivelAlerta nivel) {
        return Alerta.builder().status(status).nivel(nivel).eixo(Eixo.builder().build()).build();
    }

    private static OrdemManutencao ordem(StatusOrdem status, Alerta alerta) {
        return OrdemManutencao.builder().status(status).alerta(alerta)
            .eixo(alerta.getEixo()).criadoPor(Usuario.builder().build()).build();
    }

    @ParameterizedTest
    @CsvSource({"CRITICO, URGENTE", "MEDIO, ALTA", "BAIXO, MEDIA"})
    void prioridadePadraoDerivaDoNivel(NivelAlerta nivel, Prioridade esperada) {
        when(alertas.findByIdForUpdate(1L)).thenReturn(Optional.of(alerta(StatusAlerta.CONFIRMADO, nivel)));
        when(usuarios.findById(7L)).thenReturn(Optional.of(Usuario.builder().build()));
        when(ordens.save(any())).thenAnswer(i -> i.getArgument(0));

        var resposta = service.criar(new OrdemManutencaoRequest(1L, " Trocar vedação ", null), 7L);

        assertThat(resposta.prioridade()).isEqualTo(esperada);
        assertThat(resposta.status()).isEqualTo(StatusOrdem.ABERTA);
        assertThat(resposta.titulo()).isEqualTo("Trocar vedação");
    }

    @Test
    void prioridadeInformadaPrevalece() {
        when(alertas.findByIdForUpdate(1L)).thenReturn(Optional.of(alerta(StatusAlerta.CONFIRMADO, NivelAlerta.CRITICO)));
        when(usuarios.findById(7L)).thenReturn(Optional.of(Usuario.builder().build()));
        when(ordens.save(any())).thenAnswer(i -> i.getArgument(0));

        var resposta = service.criar(new OrdemManutencaoRequest(1L, "t", Prioridade.BAIXA), 7L);

        assertThat(resposta.prioridade()).isEqualTo(Prioridade.BAIXA);
    }

    @Test
    void naoCriaOrdemParaAlertaNaoConfirmado() {
        when(alertas.findByIdForUpdate(1L)).thenReturn(Optional.of(alerta(StatusAlerta.EM_ANALISE, NivelAlerta.CRITICO)));

        assertThatThrownBy(() -> service.criar(new OrdemManutencaoRequest(1L, "t", null), 7L))
            .isInstanceOf(RegraNegocioException.class);
        verify(ordens, never()).save(any());
    }

    @Test
    void naoCriaSegundaOrdemAtivaParaOMesmoAlerta() {
        when(alertas.findByIdForUpdate(1L)).thenReturn(Optional.of(alerta(StatusAlerta.CONFIRMADO, NivelAlerta.MEDIO)));
        when(ordens.existsByAlertaIdAndStatusNot(1L, StatusOrdem.CANCELADA)).thenReturn(true);

        assertThatThrownBy(() -> service.criar(new OrdemManutencaoRequest(1L, "t", null), 7L))
            .isInstanceOf(RegraNegocioException.class);
        verify(ordens, never()).save(any());
    }

    @ParameterizedTest
    @CsvSource({
        "ABERTA,       EM_ANDAMENTO",
        "ABERTA,       CANCELADA",
        "EM_ANDAMENTO, CONCLUIDA",
        "EM_ANDAMENTO, CANCELADA",
    })
    void transicoesPermitidas(StatusOrdem de, StatusOrdem para) {
        var o = ordem(de, alerta(StatusAlerta.CONFIRMADO, NivelAlerta.MEDIO));
        when(ordens.findById(1L)).thenReturn(Optional.of(o));

        assertThat(service.atualizarStatus(1L, para).status()).isEqualTo(para);
    }

    @ParameterizedTest
    @CsvSource({
        "ABERTA,       CONCLUIDA",
        "ABERTA,       ABERTA",
        "EM_ANDAMENTO, ABERTA",
        "CONCLUIDA,    EM_ANDAMENTO",
        "CANCELADA,    ABERTA",
    })
    void transicoesProibidas(StatusOrdem de, StatusOrdem para) {
        var o = ordem(de, alerta(StatusAlerta.CONFIRMADO, NivelAlerta.MEDIO));
        when(ordens.findById(1L)).thenReturn(Optional.of(o));

        assertThatThrownBy(() -> service.atualizarStatus(1L, para)).isInstanceOf(RegraNegocioException.class);
        assertThat(o.getStatus()).isEqualTo(de);
    }

    @Test
    void concluirOrdemFechaOAlerta() {
        Alerta alerta = alerta(StatusAlerta.CONFIRMADO, NivelAlerta.CRITICO);
        when(ordens.findById(1L)).thenReturn(Optional.of(ordem(StatusOrdem.EM_ANDAMENTO, alerta)));

        service.atualizarStatus(1L, StatusOrdem.CONCLUIDA);

        assertThat(alerta.getStatus()).isEqualTo(StatusAlerta.FECHADO);
    }

    @Test
    void cancelarOrdemMantemAlertaConfirmado() {
        Alerta alerta = alerta(StatusAlerta.CONFIRMADO, NivelAlerta.CRITICO);
        when(ordens.findById(1L)).thenReturn(Optional.of(ordem(StatusOrdem.ABERTA, alerta)));

        service.atualizarStatus(1L, StatusOrdem.CANCELADA);

        assertThat(alerta.getStatus()).isEqualTo(StatusAlerta.CONFIRMADO);
    }
}
