package br.com.railsense_backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import br.com.railsense_backend.dto.response.PontoLeitura;
import br.com.railsense_backend.enums.TipoSensor;
import br.com.railsense_backend.models.Eixo;
import br.com.railsense_backend.models.Leitura;
import br.com.railsense_backend.models.Sensor;
import br.com.railsense_backend.repository.EixoRepository;
import br.com.railsense_backend.repository.LeituraRepository;
import br.com.railsense_backend.repository.SensorRepository;

@ExtendWith(MockitoExtension.class)
class LeituraServiceTest {

    @Mock SensorRepository sensores;
    @Mock LeituraRepository leituras;
    @Mock EixoRepository eixos;

    LeituraService service;

    @BeforeEach
    void setUp() {
        service = new LeituraService(sensores, leituras, eixos);
    }

    @Test
    void gravaLeituraNoEixoDoSensorEAtualizaUltimoValor() {
        Eixo eixo = Eixo.builder().identificadorUnico("E1").build();
        Sensor sensor = Sensor.builder().codigo("esp32-01").tipo(TipoSensor.VIBRACAO).eixo(eixo).build();
        Instant agora = Instant.parse("2026-10-16T12:00:00Z");
        when(sensores.findByCodigoIgnoreCaseAndTipo("esp32-01", TipoSensor.VIBRACAO)).thenReturn(Optional.of(sensor));

        boolean gravada = service.registrar(" esp32-01 ", TipoSensor.VIBRACAO, 2048, agora);

        assertThat(gravada).isTrue();
        ArgumentCaptor<Leitura> captor = ArgumentCaptor.forClass(Leitura.class);
        verify(leituras).save(captor.capture());
        assertThat(captor.getValue().getEixo()).isSameAs(eixo);
        assertThat(captor.getValue().getValor()).isEqualTo(2048);
        assertThat(sensor.getUltimoValor()).isEqualTo(2048);
        assertThat(sensor.getUltimaLeituraEm()).isEqualTo(agora);
    }

    @Test
    void ignoraSensorDesativadoOuDesconhecido() {
        Sensor desativado = Sensor.builder().ativo(false).eixo(Eixo.builder().build()).build();
        when(sensores.findByCodigoIgnoreCaseAndTipo("off", TipoSensor.TEMPERATURA)).thenReturn(Optional.of(desativado));
        when(sensores.findByCodigoIgnoreCaseAndTipo("x", TipoSensor.TEMPERATURA)).thenReturn(Optional.empty());

        assertThat(service.registrar("off", TipoSensor.TEMPERATURA, 40, Instant.now())).isFalse();
        assertThat(service.registrar("x", TipoSensor.TEMPERATURA, 40, Instant.now())).isFalse();
        verify(leituras, never()).save(any());
    }

    @Test
    void serieCurtaNaoEReduzida() {
        List<PontoLeitura> pontos = pontos(10);

        assertThat(LeituraService.reduzir(pontos, 360)).isSameAs(pontos);
    }

    @Test
    void serieLongaViraNoMaximoOLimiteComMediaPorBloco() {
        List<PontoLeitura> reduzida = LeituraService.reduzir(pontos(21_600), LeituraService.MAX_PONTOS);

        assertThat(reduzida).hasSizeLessThanOrEqualTo(LeituraService.MAX_PONTOS);
        // Primeiro bloco: valores 0..59, média 29,5.
        assertThat(reduzida.getFirst().valor()).isEqualTo(29.5);
    }

    private static List<PontoLeitura> pontos(int n) {
        Instant inicio = Instant.parse("2026-10-16T06:00:00Z");
        return IntStream.range(0, n).mapToObj(i -> new PontoLeitura(inicio.plusSeconds(i), i)).toList();
    }
}
