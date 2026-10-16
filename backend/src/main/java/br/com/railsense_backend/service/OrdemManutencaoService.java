package br.com.railsense_backend.service;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.railsense_backend.dto.request.OrdemManutencaoRequest;
import br.com.railsense_backend.dto.response.OrdemManutencaoResponse;
import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.Prioridade;
import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.enums.StatusOrdem;
import br.com.railsense_backend.exception.AlertaNotFoundException;
import br.com.railsense_backend.exception.OrdemManutencaoNotFoundException;
import br.com.railsense_backend.exception.RegraNegocioException;
import br.com.railsense_backend.models.Alerta;
import br.com.railsense_backend.models.OrdemManutencao;
import br.com.railsense_backend.models.Usuario;
import br.com.railsense_backend.repository.AlertaRepository;
import br.com.railsense_backend.repository.OrdemManutencaoRepository;
import br.com.railsense_backend.repository.UsuarioRepository;

@Service
public class OrdemManutencaoService {

    /** Transições permitidas; CONCLUIDA e CANCELADA são finais. */
    private static final Map<StatusOrdem, Set<StatusOrdem>> TRANSICOES = Map.of(
        StatusOrdem.ABERTA, EnumSet.of(StatusOrdem.EM_ANDAMENTO, StatusOrdem.CANCELADA),
        StatusOrdem.EM_ANDAMENTO, EnumSet.of(StatusOrdem.CONCLUIDA, StatusOrdem.CANCELADA),
        StatusOrdem.CONCLUIDA, EnumSet.noneOf(StatusOrdem.class),
        StatusOrdem.CANCELADA, EnumSet.noneOf(StatusOrdem.class));

    private final OrdemManutencaoRepository ordens;
    private final AlertaRepository alertas;
    private final UsuarioRepository usuarios;

    public OrdemManutencaoService(OrdemManutencaoRepository ordens, AlertaRepository alertas,
            UsuarioRepository usuarios) {
        this.ordens = ordens;
        this.alertas = alertas;
        this.usuarios = usuarios;
    }

    @Transactional
    public OrdemManutencaoResponse criar(OrdemManutencaoRequest request, Long usuarioId) {
        Long alertaId = request.alertaId();
        Alerta alerta = alertas.findByIdForUpdate(alertaId).orElseThrow(() -> new AlertaNotFoundException(alertaId));
        if (alerta.getStatus() != StatusAlerta.CONFIRMADO) {
            throw new RegraNegocioException("Só é possível abrir ordem para alerta CONFIRMADO (status atual: "
                + alerta.getStatus() + ").");
        }
        // Uma ordem ativa por alerta; uma cancelada libera a abertura de outra.
        if (ordens.existsByAlertaIdAndStatusNot(alertaId, StatusOrdem.CANCELADA)) {
            throw new RegraNegocioException("O alerta " + alertaId + " já possui ordem de manutenção.");
        }
        Usuario usuario = usuarios.findById(usuarioId)
            .orElseThrow(() -> new RegraNegocioException("Usuário da sessão não existe mais."));

        OrdemManutencao ordem = ordens.save(OrdemManutencao.builder()
            .alerta(alerta)
            .eixo(alerta.getEixo())
            .titulo(request.titulo().trim())
            .prioridade(request.prioridade() != null ? request.prioridade() : prioridadePadrao(alerta.getNivel()))
            .status(StatusOrdem.ABERTA)
            .criadoPor(usuario)
            .build());
        return OrdemManutencaoResponse.from(ordem);
    }

    @Transactional(readOnly = true)
    public List<OrdemManutencaoResponse> listar(StatusOrdem status) {
        var lista = status != null ? ordens.findByStatus(status) : ordens.findAll();
        return lista.stream().map(OrdemManutencaoResponse::from).toList();
    }

    @Transactional
    public OrdemManutencaoResponse atualizarStatus(Long ordemId, StatusOrdem novo) {
        OrdemManutencao ordem = ordens.findById(ordemId)
            .orElseThrow(() -> new OrdemManutencaoNotFoundException(ordemId));
        if (!TRANSICOES.get(ordem.getStatus()).contains(novo)) {
            throw new RegraNegocioException("Transição inválida: " + ordem.getStatus() + " -> " + novo + ".");
        }
        ordem.setStatus(novo);
        if (novo == StatusOrdem.CONCLUIDA) {
            ordem.getAlerta().setStatus(StatusAlerta.FECHADO);
        }
        return OrdemManutencaoResponse.from(ordem);
    }

    private static Prioridade prioridadePadrao(NivelAlerta nivel) {
        return switch (nivel) {
            case CRITICO -> Prioridade.URGENTE;
            case MEDIO -> Prioridade.ALTA;
            case BAIXO -> Prioridade.MEDIA;
        };
    }
}
