package br.com.railsense_backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;

import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.StatusMonitoramento;
import br.com.railsense_backend.enums.TipoSensor;
import br.com.railsense_backend.models.Alerta;
import br.com.railsense_backend.models.Sensor;

class MonitoramentoServiceTest {

    private static final Instant AGORA = Instant.parse("2026-10-16T12:00:00Z");
    private static final Instant LIMITE = AGORA.minus(MonitoramentoService.LEITURA_RECENTE);

    @Test
    void alertaCriticoAtivoDeixaRolamentoCritico() {
        var r = MonitoramentoService.resumo(
            List.of(alerta(NivelAlerta.MEDIO), alerta(NivelAlerta.CRITICO)), List.of(), LIMITE);

        assertThat(r.status()).isEqualTo(StatusMonitoramento.CRITICO);
        assertThat(r.alertasAtivos()).isEqualTo(2);
        assertThat(r.alertasCriticos()).isEqualTo(1);
    }

    @Test
    void alertaNaoCriticoDeixaEmAtencaoMesmoSemLeituras() {
        var r = MonitoramentoService.resumo(List.of(alerta(NivelAlerta.BAIXO)), List.of(), LIMITE);

        assertThat(r.status()).isEqualTo(StatusMonitoramento.ATENCAO);
    }

    @Test
    void leituraRecenteSemAlertaENormalETrazUltimosValores() {
        var r = MonitoramentoService.resumo(List.of(), List.of(
            sensor(TipoSensor.VIBRACAO, 2048.0, AGORA.minusSeconds(5)),
            sensor(TipoSensor.TEMPERATURA, 41.5, AGORA.minusSeconds(30))), LIMITE);

        assertThat(r.status()).isEqualTo(StatusMonitoramento.NORMAL);
        assertThat(r.vibracao()).isEqualTo(2048.0);
        assertThat(r.temperatura()).isEqualTo(41.5);
        assertThat(r.ultimaLeituraEm()).isEqualTo(AGORA.minusSeconds(5));
    }

    @Test
    void leituraAntigaOuAusenteFicaSemLeituras() {
        var antiga = MonitoramentoService.resumo(List.of(),
            List.of(sensor(TipoSensor.VIBRACAO, 10.0, AGORA.minusSeconds(3600))), LIMITE);
        var nunca = MonitoramentoService.resumo(List.of(), List.of(sensor(TipoSensor.VIBRACAO, null, null)), LIMITE);

        assertThat(antiga.status()).isEqualTo(StatusMonitoramento.SEM_LEITURAS);
        assertThat(antiga.vibracao()).isEqualTo(10.0);
        assertThat(nunca.status()).isEqualTo(StatusMonitoramento.SEM_LEITURAS);
        assertThat(nunca.vibracao()).isNull();
    }

    @Test
    void conjuntoAssumePiorSituacaoEVazioFicaSemLeituras() {
        assertThat(MonitoramentoService.pior(List.of(
            StatusMonitoramento.NORMAL, StatusMonitoramento.CRITICO, StatusMonitoramento.SEM_LEITURAS)))
            .isEqualTo(StatusMonitoramento.CRITICO);
        assertThat(MonitoramentoService.pior(List.of(StatusMonitoramento.SEM_LEITURAS, StatusMonitoramento.NORMAL)))
            .isEqualTo(StatusMonitoramento.NORMAL);
        assertThat(MonitoramentoService.pior(List.of())).isEqualTo(StatusMonitoramento.SEM_LEITURAS);
    }

    private static Alerta alerta(NivelAlerta nivel) {
        return Alerta.builder().nivel(nivel).build();
    }

    private static Sensor sensor(TipoSensor tipo, Double valor, Instant em) {
        return Sensor.builder().tipo(tipo).ultimoValor(valor).ultimaLeituraEm(em).build();
    }
}
