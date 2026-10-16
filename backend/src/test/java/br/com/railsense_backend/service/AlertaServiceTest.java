package br.com.railsense_backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import br.com.railsense_backend.dto.request.DecisaoAlertaRequest;
import br.com.railsense_backend.enums.Classificacao;
import br.com.railsense_backend.enums.DecisaoTipo;
import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.enums.TipoEvidencia;
import br.com.railsense_backend.exception.RegraNegocioException;
import br.com.railsense_backend.models.Alerta;
import br.com.railsense_backend.models.Analise;
import br.com.railsense_backend.models.DecisaoAlerta;
import br.com.railsense_backend.models.EvidenciaAlerta;
import br.com.railsense_backend.models.Eixo;
import br.com.railsense_backend.models.Imagem;
import br.com.railsense_backend.models.Usuario;
import br.com.railsense_backend.repository.AlertaRepository;
import br.com.railsense_backend.repository.DecisaoAlertaRepository;
import br.com.railsense_backend.repository.EvidenciaAlertaRepository;
import br.com.railsense_backend.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class AlertaServiceTest {

    @Mock AlertaRepository alertas;
    @Mock EvidenciaAlertaRepository evidencias;
    @Mock DecisaoAlertaRepository decisoes;
    @Mock UsuarioRepository usuarios;

    AlertaService service;

    @BeforeEach
    void setUp() {
        service = new AlertaService(alertas, evidencias, decisoes, usuarios);
    }

    private static Analise analise(Classificacao classificacao, float score) {
        Eixo eixo = Eixo.builder().build();
        return Analise.builder()
            .classificacao(classificacao)
            .scoreDiferenca(score)
            .imagemBaseline(Imagem.builder().eixo(eixo).build())
            .imagemAtual(Imagem.builder().eixo(eixo).build())
            .build();
    }

    @ParameterizedTest
    @CsvSource({
        "SUSPEITO,  0.69, BAIXO",
        "SUSPEITO,  0.70, MEDIO",
        "VAZAMENTO, 0.69, MEDIO",
        "VAZAMENTO, 0.70, CRITICO",
    })
    void nivelDependeDaClassificacaoEDoLimiar(Classificacao classificacao, float score, NivelAlerta esperado) {
        when(alertas.save(any())).thenAnswer(i -> i.getArgument(0));

        Optional<Alerta> alerta = service.avaliarEGerarAlerta(analise(classificacao, score));

        assertThat(alerta).get().extracting(Alerta::getNivel).isEqualTo(esperado);
        assertThat(alerta.get().getStatus()).isEqualTo(StatusAlerta.NOVO);
    }

    @Test
    void analiseNormalNaoGeraAlertaNemEvidencia() {
        assertThat(service.avaliarEGerarAlerta(analise(Classificacao.NORMAL, 0.9f))).isEmpty();
        verify(alertas, never()).save(any());
        verify(evidencias, never()).saveAll(anyList());
    }

    @Test
    @SuppressWarnings("unchecked")
    void alertaGravaBaselineEAtualComoEvidencia() {
        when(alertas.save(any())).thenAnswer(i -> i.getArgument(0));
        Analise analise = analise(Classificacao.VAZAMENTO, 0.9f);

        service.avaliarEGerarAlerta(analise);

        ArgumentCaptor<List<EvidenciaAlerta>> captor = ArgumentCaptor.forClass(List.class);
        verify(evidencias).saveAll(captor.capture());
        assertThat(captor.getValue())
            .extracting(EvidenciaAlerta::getTipo, EvidenciaAlerta::getImagem)
            .containsExactlyInAnyOrder(
                org.assertj.core.groups.Tuple.tuple(TipoEvidencia.BASELINE, analise.getImagemBaseline()),
                org.assertj.core.groups.Tuple.tuple(TipoEvidencia.ATUAL, analise.getImagemAtual()));
    }

    @Test
    void confirmarMudaStatusDoAlertaERegistraDecisao() {
        Alerta alerta = Alerta.builder().status(StatusAlerta.NOVO).build();
        when(alertas.findByIdForUpdate(1L)).thenReturn(Optional.of(alerta));
        when(usuarios.findById(7L)).thenReturn(Optional.of(Usuario.builder().nome("Ana").build()));
        when(decisoes.save(any())).thenAnswer(i -> i.getArgument(0));

        var resposta = service.decidir(1L, 7L, new DecisaoAlertaRequest(DecisaoTipo.CONFIRMADO, "  vazamento  "));

        assertThat(alerta.getStatus()).isEqualTo(StatusAlerta.CONFIRMADO);
        assertThat(resposta.motivo()).isEqualTo("vazamento");
        assertThat(resposta.usuarioNome()).isEqualTo("Ana");
    }

    @Test
    void falsoPositivoMudaStatusParaFalsoPositivo() {
        Alerta alerta = Alerta.builder().status(StatusAlerta.EM_ANALISE).build();
        when(alertas.findByIdForUpdate(1L)).thenReturn(Optional.of(alerta));
        when(usuarios.findById(7L)).thenReturn(Optional.of(Usuario.builder().build()));
        when(decisoes.save(any())).thenAnswer(i -> i.getArgument(0));

        service.decidir(1L, 7L, new DecisaoAlertaRequest(DecisaoTipo.FALSO_POSITIVO, null));

        assertThat(alerta.getStatus()).isEqualTo(StatusAlerta.FALSO_POSITIVO);
    }

    @Test
    void naoPermiteDecidirAlertaJaDecidido() {
        Alerta alerta = Alerta.builder().status(StatusAlerta.CONFIRMADO).build();
        when(alertas.findByIdForUpdate(1L)).thenReturn(Optional.of(alerta));

        assertThatThrownBy(() -> service.decidir(1L, 7L, new DecisaoAlertaRequest(DecisaoTipo.FALSO_POSITIVO, null)))
            .isInstanceOf(RegraNegocioException.class);
        verify(decisoes, never()).save(any(DecisaoAlerta.class));
        assertThat(alerta.getStatus()).isEqualTo(StatusAlerta.CONFIRMADO);
    }
}
