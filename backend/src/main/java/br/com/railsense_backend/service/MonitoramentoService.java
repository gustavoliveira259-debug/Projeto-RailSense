package br.com.railsense_backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.railsense_backend.dto.response.EixoResponse;
import br.com.railsense_backend.dto.response.TremResponse;
import br.com.railsense_backend.dto.response.VagaoResponse;
import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.enums.StatusMonitoramento;
import br.com.railsense_backend.enums.TipoSensor;
import br.com.railsense_backend.exception.EixoNotFoundException;
import br.com.railsense_backend.exception.TremNotFoundException;
import br.com.railsense_backend.exception.VagaoNotFoundException;
import br.com.railsense_backend.models.Alerta;
import br.com.railsense_backend.models.Eixo;
import br.com.railsense_backend.models.Sensor;
import br.com.railsense_backend.models.Trem;
import br.com.railsense_backend.models.Vagao;
import br.com.railsense_backend.repository.AlertaRepository;
import br.com.railsense_backend.repository.EixoRepository;
import br.com.railsense_backend.repository.SensorRepository;
import br.com.railsense_backend.repository.TremRepository;
import br.com.railsense_backend.repository.VagaoRepository;

/**
 * Calcula a situação de rolamentos (eixos), vagões e trens para as telas de monitoramento.
 *
 * Rolamento: CRITICO se houver alerta ativo crítico; ATENCAO se houver qualquer alerta ativo;
 * NORMAL se algum sensor enviou leitura recentemente; senão SEM_LEITURAS.
 * Vagão e trem assumem a pior situação entre os seus rolamentos ativos.
 */
@Service
public class MonitoramentoService {

    /** Alertas que ainda exigem atenção: aguardando decisão ou confirmados e não fechados. */
    public static final Set<StatusAlerta> STATUS_ATIVOS =
        EnumSet.of(StatusAlerta.NOVO, StatusAlerta.EM_ANALISE, StatusAlerta.CONFIRMADO);

    /** Sem leitura nesse intervalo, o rolamento aparece como "sem leituras". */
    static final Duration LEITURA_RECENTE = Duration.ofMinutes(10);

    private final TremRepository trens;
    private final VagaoRepository vagoes;
    private final EixoRepository eixos;
    private final AlertaRepository alertas;
    private final SensorRepository sensores;

    public MonitoramentoService(TremRepository trens, VagaoRepository vagoes, EixoRepository eixos,
            AlertaRepository alertas, SensorRepository sensores) {
        this.trens = trens;
        this.vagoes = vagoes;
        this.eixos = eixos;
        this.alertas = alertas;
        this.sensores = sensores;
    }

    @Transactional(readOnly = true)
    public List<TremResponse> listarTrens() {
        List<Eixo> todosEixos = eixos.findAll();
        Map<Long, ResumoEixo> resumos = resumir(todosEixos);
        List<Vagao> todosVagoes = vagoes.findAll();
        return trens.findAll().stream()
            .sorted(Comparator.comparing(Trem::getCodigo, String.CASE_INSENSITIVE_ORDER))
            .map(t -> tremResponse(t, todosVagoes, todosEixos, resumos))
            .toList();
    }

    @Transactional(readOnly = true)
    public TremResponse buscarTrem(Long id) {
        Trem trem = trens.findById(id).orElseThrow(() -> new TremNotFoundException(id));
        List<Vagao> vagoesDoTrem = vagoes.findByTremId(id);
        List<Eixo> eixosDoTrem = vagoesDoTrem.stream()
            .flatMap(v -> eixos.findByVagaoIdOrderByPosicaoAsc(v.getId()).stream())
            .toList();
        return tremResponse(trem, vagoesDoTrem, eixosDoTrem, resumir(eixosDoTrem));
    }

    /** tremId nulo lista todos os vagões. */
    @Transactional(readOnly = true)
    public List<VagaoResponse> listarVagoes(Long tremId) {
        List<Vagao> lista = tremId != null ? vagoes.findByTremId(tremId) : vagoes.findAll();
        List<Eixo> todosEixos = eixos.findAll();
        Map<Long, ResumoEixo> resumos = resumir(todosEixos);
        Map<Long, List<Eixo>> eixosPorVagao = todosEixos.stream()
            .filter(e -> e.getVagao() != null)
            .collect(Collectors.groupingBy(e -> e.getVagao().getId()));
        return lista.stream()
            .sorted(Comparator.comparing(Vagao::getNumeroUk, String.CASE_INSENSITIVE_ORDER))
            .map(v -> vagaoResponse(v, eixosPorVagao.getOrDefault(v.getId(), List.of()), resumos))
            .toList();
    }

    @Transactional(readOnly = true)
    public VagaoResponse buscarVagao(Long id) {
        Vagao vagao = vagoes.findById(id).orElseThrow(() -> new VagaoNotFoundException(id));
        List<Eixo> eixosDoVagao = eixos.findByVagaoIdOrderByPosicaoAsc(id);
        return vagaoResponse(vagao, eixosDoVagao, resumir(eixosDoVagao));
    }

    /** vagaoId nulo lista todos os eixos. */
    @Transactional(readOnly = true)
    public List<EixoResponse> listarEixos(Long vagaoId) {
        List<Eixo> lista = vagaoId != null ? eixos.findByVagaoIdOrderByPosicaoAsc(vagaoId) : eixos.findAll();
        Map<Long, ResumoEixo> resumos = resumir(lista);
        return lista.stream()
            .sorted(Comparator.comparing((Eixo e) -> e.getVagao().getNumeroUk(), String.CASE_INSENSITIVE_ORDER)
                .thenComparingInt(Eixo::getPosicao))
            .map(e -> eixoResponse(e, resumos.get(e.getId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public EixoResponse buscarEixo(Long id) {
        Eixo eixo = eixos.findById(id).orElseThrow(() -> new EixoNotFoundException(id));
        return eixoResponse(eixo, resumir(List.of(eixo)).get(id));
    }

    private Map<Long, ResumoEixo> resumir(Collection<Eixo> lista) {
        List<Long> ids = lista.stream().map(Eixo::getId).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Set<Long> idSet = Set.copyOf(ids);
        Map<Long, List<Alerta>> alertasPorEixo = alertas.findByStatusIn(STATUS_ATIVOS).stream()
            .filter(a -> a.getEixo() != null && idSet.contains(a.getEixo().getId()))
            .collect(Collectors.groupingBy(a -> a.getEixo().getId()));
        Map<Long, List<Sensor>> sensoresPorEixo = sensores.findByEixoIdIn(ids).stream()
            .filter(Sensor::isAtivo)
            .collect(Collectors.groupingBy(s -> s.getEixo().getId()));
        Instant limiteRecente = Instant.now().minus(LEITURA_RECENTE);

        return ids.stream().collect(Collectors.toMap(Function.identity(), id -> resumo(
            alertasPorEixo.getOrDefault(id, List.of()),
            sensoresPorEixo.getOrDefault(id, List.of()),
            limiteRecente)));
    }

    static ResumoEixo resumo(List<Alerta> alertasAtivos, List<Sensor> sensoresAtivos, Instant limiteRecente) {
        int criticos = (int) alertasAtivos.stream().filter(a -> a.getNivel() == NivelAlerta.CRITICO).count();
        Instant ultima = sensoresAtivos.stream()
            .map(Sensor::getUltimaLeituraEm)
            .filter(Objects::nonNull)
            .max(Comparator.naturalOrder())
            .orElse(null);

        StatusMonitoramento status;
        if (criticos > 0) {
            status = StatusMonitoramento.CRITICO;
        } else if (!alertasAtivos.isEmpty()) {
            status = StatusMonitoramento.ATENCAO;
        } else if (ultima != null && ultima.isAfter(limiteRecente)) {
            status = StatusMonitoramento.NORMAL;
        } else {
            status = StatusMonitoramento.SEM_LEITURAS;
        }
        return new ResumoEixo(status, alertasAtivos.size(), criticos,
            ultimoValor(sensoresAtivos, TipoSensor.VIBRACAO), ultimoValor(sensoresAtivos, TipoSensor.TEMPERATURA),
            ultima);
    }

    /** Pior situação do conjunto; um conjunto vazio fica SEM_LEITURAS. */
    static StatusMonitoramento pior(Collection<StatusMonitoramento> status) {
        return status.stream().max(Comparator.naturalOrder()).orElse(StatusMonitoramento.SEM_LEITURAS);
    }

    private static Double ultimoValor(List<Sensor> lista, TipoSensor tipo) {
        return lista.stream()
            .filter(s -> s.getTipo() == tipo && s.getUltimaLeituraEm() != null)
            .max(Comparator.comparing(Sensor::getUltimaLeituraEm))
            .map(Sensor::getUltimoValor)
            .orElse(null);
    }

    private static TremResponse tremResponse(Trem trem, List<Vagao> vagoesCandidatos, List<Eixo> eixosCandidatos,
            Map<Long, ResumoEixo> resumos) {
        List<Vagao> doTrem = vagoesCandidatos.stream()
            .filter(v -> v.isAtivo() && v.getTrem() != null && v.getTrem().getId().equals(trem.getId()))
            .toList();
        Set<Long> vagaoIds = doTrem.stream().map(Vagao::getId).collect(Collectors.toSet());
        List<ResumoEixo> rolamentos = eixosCandidatos.stream()
            .filter(e -> e.isAtivo() && e.getVagao() != null && vagaoIds.contains(e.getVagao().getId()))
            .map(e -> resumos.get(e.getId()))
            .filter(Objects::nonNull)
            .toList();
        return new TremResponse(trem.getId(), trem.getCodigo(), trem.getNome(), trem.isAtivo(),
            doTrem.size(), rolamentos.size(),
            rolamentos.stream().mapToInt(ResumoEixo::alertasAtivos).sum(),
            rolamentos.stream().mapToInt(ResumoEixo::alertasCriticos).sum(),
            pior(rolamentos.stream().map(ResumoEixo::status).toList()));
    }

    private static VagaoResponse vagaoResponse(Vagao v, List<Eixo> eixosDoVagao, Map<Long, ResumoEixo> resumos) {
        List<ResumoEixo> rolamentos = eixosDoVagao.stream()
            .filter(Eixo::isAtivo)
            .map(e -> resumos.get(e.getId()))
            .filter(Objects::nonNull)
            .toList();
        var trem = v.getTrem();
        var patio = v.getPatioLinha();
        return new VagaoResponse(v.getId(), v.getNumeroUk(), v.getTipo(),
            trem != null ? trem.getId() : null, trem != null ? trem.getCodigo() : null,
            patio != null ? patio.getId() : null, patio != null ? patio.getNome() : null,
            v.isAtivo(), rolamentos.size(),
            rolamentos.stream().mapToInt(ResumoEixo::alertasAtivos).sum(),
            rolamentos.stream().mapToInt(ResumoEixo::alertasCriticos).sum(),
            pior(rolamentos.stream().map(ResumoEixo::status).toList()));
    }

    private static EixoResponse eixoResponse(Eixo e, ResumoEixo r) {
        Vagao v = e.getVagao();
        var trem = v != null ? v.getTrem() : null;
        var patio = v != null ? v.getPatioLinha() : null;
        return new EixoResponse(e.getId(), e.getPosicao(), e.getIdentificadorUnico(),
            v != null ? v.getId() : null, v != null ? v.getNumeroUk() : null,
            trem != null ? trem.getId() : null, trem != null ? trem.getCodigo() : null,
            patio != null ? patio.getNome() : null,
            e.isAtivo(), r.status(), r.alertasAtivos(), r.alertasCriticos(),
            r.vibracao(), r.temperatura(), r.ultimaLeituraEm());
    }

    record ResumoEixo(StatusMonitoramento status, int alertasAtivos, int alertasCriticos,
            Double vibracao, Double temperatura, Instant ultimaLeituraEm) {}
}
