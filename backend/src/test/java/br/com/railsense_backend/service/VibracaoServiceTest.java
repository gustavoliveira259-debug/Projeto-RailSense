package br.com.railsense_backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import br.com.railsense_backend.exception.EixoNotFoundException;
import br.com.railsense_backend.models.Eixo;
import br.com.railsense_backend.models.LeituraVibracao;
import br.com.railsense_backend.repository.EixoRepository;
import br.com.railsense_backend.repository.LeituraVibracaoRepository;

@ExtendWith(MockitoExtension.class)
class VibracaoServiceTest {

    @Mock EixoRepository eixos;
    @Mock LeituraVibracaoRepository leituras;

    VibracaoService service;
    Eixo eixo;

    @BeforeEach
    void setUp() {
        service = new VibracaoService(eixos, leituras, 3000, 4095, 7);
        eixo = Eixo.builder().identificadorUnico("GDT-E1").sensorDispositivo("esp32-01").build();
        eixo.setId(1L);
    }

    @Test
    void gravaLeituraNoEixoDoSensor() {
        when(eixos.findBySensorDispositivoAndAtivoTrue("esp32-01")).thenReturn(Optional.of(eixo));

        assertThat(service.registrar("esp32-01", 2048)).isTrue();

        var captor = ArgumentCaptor.forClass(LeituraVibracao.class);
        verify(leituras).save(captor.capture());
        assertThat(captor.getValue().getEixo()).isSameAs(eixo);
        assertThat(captor.getValue().getValor()).isEqualTo(2048);
        assertThat(captor.getValue().getDispositivo()).isEqualTo("esp32-01");
    }

    @Test
    void ignoraSensorSemEixoAtivo() {
        when(eixos.findBySensorDispositivoAndAtivoTrue("esp32-99")).thenReturn(Optional.empty());

        assertThat(service.registrar("esp32-99", 2048)).isFalse();
        verify(leituras, never()).save(any());
    }

    @Test
    void limitaJanelaA60Minutos() {
        when(eixos.findById(1L)).thenReturn(Optional.of(eixo));
        var leitura = LeituraVibracao.builder().eixo(eixo).dispositivo("esp32-01").valor(3100).build();
        leitura.setCriadoEm(Instant.now());
        var desde = ArgumentCaptor.forClass(Instant.class);
        when(leituras.findByEixoIdAndCriadoEmAfterOrderByCriadoEmAsc(eq(1L), desde.capture()))
            .thenReturn(List.of(leitura));

        var resposta = service.listar(1L, 500);

        assertThat(Duration.between(desde.getValue(), Instant.now()).toMinutes()).isBetween(59L, 60L);
        assertThat(resposta.sensorDispositivo()).isEqualTo("esp32-01");
        assertThat(resposta.limiar()).isEqualTo(3000);
        assertThat(resposta.leituras()).singleElement().extracting(l -> l.valor()).isEqualTo(3100);
    }

    @Test
    void eixoInexistenteDa404() {
        when(eixos.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.listar(9L, 10)).isInstanceOf(EixoNotFoundException.class);
    }
}
