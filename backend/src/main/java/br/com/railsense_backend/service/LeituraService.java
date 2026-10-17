package br.com.railsense_backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.railsense_backend.dto.response.PontoLeitura;
import br.com.railsense_backend.dto.response.SerieLeiturasResponse;
import br.com.railsense_backend.enums.TipoSensor;
import br.com.railsense_backend.exception.EixoNotFoundException;
import br.com.railsense_backend.exception.RequisicaoInvalidaException;
import br.com.railsense_backend.models.Leitura;
import br.com.railsense_backend.models.Sensor;
import br.com.railsense_backend.repository.EixoRepository;
import br.com.railsense_backend.repository.LeituraRepository;
import br.com.railsense_backend.repository.SensorRepository;

@Service
public class LeituraService {

    /** Janela máxima consultável pela tela (24 h). */
    static final int MAX_MINUTOS = 24 * 60;

    /** Pontos devolvidos por série: suficiente para o gráfico, leve para atualizar a cada 10 s. */
    static final int MAX_PONTOS = 360;

    private final SensorRepository sensores;
    private final LeituraRepository leituras;
    private final EixoRepository eixos;

    public LeituraService(SensorRepository sensores, LeituraRepository leituras, EixoRepository eixos) {
        this.sensores = sensores;
        this.leituras = leituras;
        this.eixos = eixos;
    }

    /**
     * Grava a leitura de um dispositivo. Retorna false (e não grava nada) se o par
     * dispositivo/tipo não estiver cadastrado ou estiver desativado.
     */
    @Transactional
    public boolean registrar(String codigoDispositivo, TipoSensor tipo, double valor, Instant em) {
        if (codigoDispositivo == null || codigoDispositivo.isBlank() || !Double.isFinite(valor)) {
            return false;
        }
        Sensor sensor = sensores.findByCodigoIgnoreCaseAndTipo(codigoDispositivo.trim(), tipo)
            .filter(Sensor::isAtivo)
            .orElse(null);
        if (sensor == null) {
            return false;
        }
        leituras.save(Leitura.builder()
            .sensor(sensor)
            .eixo(sensor.getEixo())
            .tipo(tipo)
            .valor(valor)
            .registradoEm(em)
            .build());
        sensor.setUltimoValor(valor);
        sensor.setUltimaLeituraEm(em);
        return true;
    }

    @Transactional(readOnly = true)
    public SerieLeiturasResponse serie(Long eixoId, TipoSensor tipo, int minutos) {
        if (minutos < 1 || minutos > MAX_MINUTOS) {
            throw new RequisicaoInvalidaException("A janela deve ter entre 1 e " + MAX_MINUTOS + " minutos.");
        }
        if (!eixos.existsById(eixoId)) {
            throw new EixoNotFoundException(eixoId);
        }
        Instant desde = Instant.now().minus(Duration.ofMinutes(minutos));
        return new SerieLeiturasResponse(tipo, minutos,
            reduzir(leituras.buscarSerie(eixoId, tipo, desde), MAX_PONTOS));
    }

    /** Agrupa pontos consecutivos em blocos e usa a média de cada bloco, preservando a forma da curva. */
    static List<PontoLeitura> reduzir(List<PontoLeitura> pontos, int maximo) {
        if (pontos.size() <= maximo) {
            return pontos;
        }
        int tamanhoBloco = (int) Math.ceil((double) pontos.size() / maximo);
        List<PontoLeitura> resultado = new ArrayList<>(maximo);
        for (int inicio = 0; inicio < pontos.size(); inicio += tamanhoBloco) {
            List<PontoLeitura> bloco = pontos.subList(inicio, Math.min(inicio + tamanhoBloco, pontos.size()));
            double media = bloco.stream().mapToDouble(PontoLeitura::valor).average().orElse(0);
            resultado.add(new PontoLeitura(bloco.get(bloco.size() / 2).em(), media));
        }
        return resultado;
    }
}
