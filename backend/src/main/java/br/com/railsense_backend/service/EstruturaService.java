package br.com.railsense_backend.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.railsense_backend.dto.request.EixoRequest;
import br.com.railsense_backend.dto.request.SensorRequest;
import br.com.railsense_backend.dto.request.TremRequest;
import br.com.railsense_backend.dto.request.VagaoRequest;
import br.com.railsense_backend.dto.response.SensorResponse;
import br.com.railsense_backend.exception.EixoNotFoundException;
import br.com.railsense_backend.exception.PatioLinhaNotFoundException;
import br.com.railsense_backend.exception.RegraNegocioException;
import br.com.railsense_backend.exception.SensorNotFoundException;
import br.com.railsense_backend.exception.TremNotFoundException;
import br.com.railsense_backend.exception.VagaoNotFoundException;
import br.com.railsense_backend.models.Eixo;
import br.com.railsense_backend.models.PatioLinha;
import br.com.railsense_backend.models.Sensor;
import br.com.railsense_backend.models.Trem;
import br.com.railsense_backend.models.Vagao;
import br.com.railsense_backend.repository.EixoRepository;
import br.com.railsense_backend.repository.PatioLinhaRepository;
import br.com.railsense_backend.repository.SensorRepository;
import br.com.railsense_backend.repository.TremRepository;
import br.com.railsense_backend.repository.VagaoRepository;

/**
 * Cadastro da estrutura monitorada: trem → vagão → eixo (rolamento) → sensor.
 * Nada é apagado: desativar preserva o histórico de leituras, imagens e alertas.
 */
@Service
public class EstruturaService {

    private final TremRepository trens;
    private final VagaoRepository vagoes;
    private final EixoRepository eixos;
    private final SensorRepository sensores;
    private final PatioLinhaRepository patiosLinhas;

    public EstruturaService(TremRepository trens, VagaoRepository vagoes, EixoRepository eixos,
            SensorRepository sensores, PatioLinhaRepository patiosLinhas) {
        this.trens = trens;
        this.vagoes = vagoes;
        this.eixos = eixos;
        this.sensores = sensores;
        this.patiosLinhas = patiosLinhas;
    }

    @Transactional
    public Trem criarTrem(TremRequest request) {
        String codigo = request.codigo().trim();
        if (trens.existsByCodigoIgnoreCase(codigo)) {
            throw new RegraNegocioException("Já existe um trem com o código " + codigo + ".");
        }
        return trens.save(Trem.builder()
            .codigo(codigo)
            .nome(textoOuNulo(request.nome()))
            .build());
    }

    @Transactional
    public void alterarAtivoTrem(Long id, boolean ativo) {
        trens.findById(id).orElseThrow(() -> new TremNotFoundException(id)).setAtivo(ativo);
    }

    @Transactional
    public Vagao criarVagao(VagaoRequest request) {
        String numero = request.numeroUk().trim();
        if (vagoes.existsByNumeroUkIgnoreCase(numero)) {
            throw new RegraNegocioException("Já existe um vagão com o número " + numero + ".");
        }
        Trem trem = trens.findById(request.tremId()).orElseThrow(() -> new TremNotFoundException(request.tremId()));
        PatioLinha patioLinha = request.patioLinhaId() == null ? null
            : patiosLinhas.findById(request.patioLinhaId())
                .orElseThrow(() -> new PatioLinhaNotFoundException(request.patioLinhaId()));
        return vagoes.save(Vagao.builder()
            .numeroUk(numero)
            .tipo(textoOuNulo(request.tipo()))
            .trem(trem)
            .patioLinha(patioLinha)
            .build());
    }

    @Transactional
    public void alterarAtivoVagao(Long id, boolean ativo) {
        vagoes.findById(id).orElseThrow(() -> new VagaoNotFoundException(id)).setAtivo(ativo);
    }

    @Transactional
    public Eixo criarEixo(EixoRequest request) {
        String identificador = request.identificadorUnico().trim();
        if (eixos.existsByIdentificadorUnicoIgnoreCase(identificador)) {
            throw new RegraNegocioException("Já existe um rolamento com o identificador " + identificador + ".");
        }
        Vagao vagao = vagoes.findById(request.vagaoId())
            .orElseThrow(() -> new VagaoNotFoundException(request.vagaoId()));
        return eixos.save(Eixo.builder()
            .vagao(vagao)
            .posicao(request.posicao())
            .identificadorUnico(identificador)
            .ativo(true)
            .build());
    }

    @Transactional
    public void alterarAtivoEixo(Long id, boolean ativo) {
        eixos.findById(id).orElseThrow(() -> new EixoNotFoundException(id)).setAtivo(ativo);
    }

    @Transactional(readOnly = true)
    public List<SensorResponse> listarSensores() {
        return sensores.findAll().stream()
            .sorted(Comparator.comparing(Sensor::getCodigo, String.CASE_INSENSITIVE_ORDER)
                .thenComparing(Sensor::getTipo))
            .map(SensorResponse::from)
            .toList();
    }

    @Transactional
    public SensorResponse criarSensor(SensorRequest request) {
        String codigo = request.codigo().trim();
        if (sensores.existsByCodigoIgnoreCaseAndTipo(codigo, request.tipo())) {
            throw new RegraNegocioException("Já existe um sensor de " + request.tipo().name().toLowerCase()
                + " com o código " + codigo + ".");
        }
        Eixo eixo = eixos.findById(request.eixoId()).orElseThrow(() -> new EixoNotFoundException(request.eixoId()));
        return SensorResponse.from(sensores.save(Sensor.builder()
            .codigo(codigo)
            .tipo(request.tipo())
            .eixo(eixo)
            .build()));
    }

    @Transactional
    public SensorResponse alterarAtivoSensor(Long id, boolean ativo) {
        Sensor sensor = sensores.findById(id).orElseThrow(() -> new SensorNotFoundException(id));
        sensor.setAtivo(ativo);
        return SensorResponse.from(sensor);
    }

    private static String textoOuNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
