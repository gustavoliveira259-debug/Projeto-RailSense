package br.com.railsense_backend.service;

import br.com.railsense_backend.dto.request.DecisaoAlertaRequest;
import br.com.railsense_backend.dto.response.AlertaDetalheResponse;
import br.com.railsense_backend.dto.response.DecisaoAlertaResponse;
import br.com.railsense_backend.dto.response.EvidenciaResponse;
import br.com.railsense_backend.enums.Classificacao;
import br.com.railsense_backend.enums.DecisaoTipo;
import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.enums.TipoEvidencia;
import br.com.railsense_backend.exception.AlertaNotFoundException;
import br.com.railsense_backend.exception.RegraNegocioException;
import br.com.railsense_backend.models.Alerta;
import br.com.railsense_backend.models.Analise;
import br.com.railsense_backend.models.DecisaoAlerta;
import br.com.railsense_backend.models.EvidenciaAlerta;
import br.com.railsense_backend.models.Imagem;
import br.com.railsense_backend.models.Usuario;
import br.com.railsense_backend.repository.AlertaRepository;
import br.com.railsense_backend.repository.DecisaoAlertaRepository;
import br.com.railsense_backend.repository.EvidenciaAlertaRepository;
import br.com.railsense_backend.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class AlertaService {

    private static final float LIMIAR_NIVEL_ALTO = 0.7f;
    /** Status em que o alerta ainda aguarda decisão humana. */
    private static final Set<StatusAlerta> STATUS_PENDENTES = EnumSet.of(StatusAlerta.NOVO, StatusAlerta.EM_ANALISE);

    private final AlertaRepository alertas;
    private final EvidenciaAlertaRepository evidencias;
    private final DecisaoAlertaRepository decisoes;
    private final UsuarioRepository usuarios;

    public AlertaService(AlertaRepository alertas, EvidenciaAlertaRepository evidencias,
            DecisaoAlertaRepository decisoes, UsuarioRepository usuarios) {
        this.alertas = alertas;
        this.evidencias = evidencias;
        this.decisoes = decisoes;
        this.usuarios = usuarios;
    }

    public Optional<Alerta> avaliarEGerarAlerta(Analise analise) {
        NivelAlerta nivel = determinarNivel(analise.getClassificacao(), analise.getScoreDiferenca());
        if (nivel == null) {
            return Optional.empty();
        }

        Alerta alerta = alertas.save(Alerta.builder()
            .analise(analise)
            .eixo(analise.getImagemAtual().getEixo())
            .nivel(nivel)
            .status(StatusAlerta.NOVO)
            .score(analise.getScoreDiferenca())
            .build());

        // Congela as duas imagens comparadas: a baseline do eixo pode mudar depois.
        evidencias.saveAll(List.of(
            evidencia(alerta, analise.getImagemBaseline(), TipoEvidencia.BASELINE),
            evidencia(alerta, analise.getImagemAtual(), TipoEvidencia.ATUAL)));

        return Optional.of(alerta);
    }

    @Transactional(readOnly = true)
    public AlertaDetalheResponse detalhar(Long alertaId) {
        Alerta alerta = alertas.findById(alertaId).orElseThrow(() -> new AlertaNotFoundException(alertaId));
        Analise analise = alerta.getAnalise();
        return new AlertaDetalheResponse(alerta.getId(), alerta.getNivel(), alerta.getStatus(), alerta.getScore(),
            alerta.getEixo().getId(), alerta.getEixo().getIdentificadorUnico(), alerta.getCriadoEm(),
            analise != null ? analise.getClassificacao() : null,
            regioes(analise),
            evidencias.findByAlertaId(alertaId).stream().map(EvidenciaResponse::from).toList(),
            decisoes.findByAlertaIdOrderByCriadoEmAsc(alertaId).stream().map(DecisaoAlertaResponse::from).toList());
    }

    @Transactional
    public DecisaoAlertaResponse decidir(Long alertaId, Long usuarioId, DecisaoAlertaRequest request) {
        Alerta alerta = alertas.findByIdForUpdate(alertaId).orElseThrow(() -> new AlertaNotFoundException(alertaId));
        if (!STATUS_PENDENTES.contains(alerta.getStatus())) {
            throw new RegraNegocioException("Alerta " + alertaId + " já foi decidido (status " + alerta.getStatus() + ").");
        }
        Usuario usuario = usuarios.findById(usuarioId)
            .orElseThrow(() -> new RegraNegocioException("Usuário da sessão não existe mais."));

        DecisaoAlerta decisao = decisoes.save(DecisaoAlerta.builder()
            .alerta(alerta)
            .usuario(usuario)
            .decisao(request.decisao())
            .motivo(request.motivo() != null && !request.motivo().isBlank() ? request.motivo().trim() : null)
            .build());

        alerta.setStatus(request.decisao() == DecisaoTipo.CONFIRMADO
            ? StatusAlerta.CONFIRMADO
            : StatusAlerta.FALSO_POSITIVO);
        return DecisaoAlertaResponse.from(decisao);
    }

    private NivelAlerta determinarNivel(Classificacao classificacao, Float score) {
        float valor = score != null ? score : 0f;
        return switch (classificacao) {
            case NORMAL -> null;
            case SUSPEITO -> valor >= LIMIAR_NIVEL_ALTO ? NivelAlerta.MEDIO : NivelAlerta.BAIXO;
            case VAZAMENTO -> valor >= LIMIAR_NIVEL_ALTO ? NivelAlerta.CRITICO : NivelAlerta.MEDIO;
        };
    }

    private static EvidenciaAlerta evidencia(Alerta alerta, Imagem imagem, TipoEvidencia tipo) {
        return EvidenciaAlerta.builder().alerta(alerta).imagem(imagem).tipo(tipo).build();
    }

    @SuppressWarnings("unchecked")
    private static List<String> regioes(Analise analise) {
        if (analise == null || analise.getRegioesAnomalia() == null) {
            return List.of();
        }
        Object regioes = ((Map<String, Object>) analise.getRegioesAnomalia()).get("regioes");
        return regioes instanceof List<?> lista ? (List<String>) lista : List.of();
    }
}
