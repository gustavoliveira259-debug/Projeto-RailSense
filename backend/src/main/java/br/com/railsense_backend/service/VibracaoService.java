package br.com.railsense_backend.service;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.railsense_backend.dto.response.VibracaoResponse;
import br.com.railsense_backend.exception.EixoNotFoundException;
import br.com.railsense_backend.models.Eixo;
import br.com.railsense_backend.models.LeituraVibracao;
import br.com.railsense_backend.repository.EixoRepository;
import br.com.railsense_backend.repository.LeituraVibracaoRepository;

@Service
public class VibracaoService {

    private static final Logger log = LoggerFactory.getLogger(VibracaoService.class);

    /** Janela máxima consultável de uma vez: 1 h ≈ 3.600 leituras a 1 Hz. */
    static final int MINUTOS_MAXIMOS = 60;

    private final EixoRepository eixos;
    private final LeituraVibracaoRepository leituras;
    private final int limiar;
    private final int valorMaximo;
    private final int retencaoDias;

    public VibracaoService(EixoRepository eixos, LeituraVibracaoRepository leituras,
            @Value("${app.vibracao.limiar:3000}") int limiar,
            @Value("${app.vibracao.valor-maximo:4095}") int valorMaximo,
            @Value("${app.vibracao.retencao-dias:7}") int retencaoDias) {
        this.eixos = eixos;
        this.leituras = leituras;
        this.limiar = limiar;
        this.valorMaximo = valorMaximo;
        this.retencaoDias = retencaoDias;
    }

    /** Grava a leitura no eixo vinculado ao dispositivo; devolve false se nenhum eixo ativo usa esse sensor. */
    @Transactional
    public boolean registrar(String dispositivo, int valor) {
        var eixo = eixos.findBySensorDispositivoAndAtivoTrue(dispositivo);
        if (eixo.isEmpty()) {
            log.debug("Leitura de vibração ignorada: nenhum eixo ativo com o sensor {}", dispositivo);
            return false;
        }
        leituras.save(LeituraVibracao.builder().eixo(eixo.get()).dispositivo(dispositivo).valor(valor).build());
        return true;
    }

    @Transactional(readOnly = true)
    public VibracaoResponse listar(Long eixoId, int minutos) {
        Eixo eixo = eixos.findById(eixoId).orElseThrow(() -> new EixoNotFoundException(eixoId));
        int janela = Math.clamp(minutos, 1, MINUTOS_MAXIMOS);
        Instant desde = Instant.now().minus(Duration.ofMinutes(janela));
        List<VibracaoResponse.Leitura> pontos = leituras
            .findByEixoIdAndCriadoEmAfterOrderByCriadoEmAsc(eixoId, desde).stream()
            .map(l -> new VibracaoResponse.Leitura(l.getValor(), l.getCriadoEm()))
            .toList();
        return new VibracaoResponse(eixoId, eixo.getSensorDispositivo(), limiar, valorMaximo, pontos);
    }

    /** A 1 leitura/s por sensor a tabela cresce ~86 mil linhas por dia; guarda só os últimos dias. */
    @Scheduled(cron = "${app.vibracao.limpeza-cron:0 17 * * * *}")
    @Transactional
    public void apagarLeiturasAntigas() {
        int apagadas = leituras.apagarAnterioresA(Instant.now().minus(retencaoDias, ChronoUnit.DAYS));
        if (apagadas > 0) {
            log.info("Leituras de vibração antigas apagadas: {}", apagadas);
        }
    }
}
