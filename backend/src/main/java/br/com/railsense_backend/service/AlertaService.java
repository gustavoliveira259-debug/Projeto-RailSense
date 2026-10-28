package br.com.railsense_backend.service;

import br.com.railsense_backend.dto.request.DecisaoAlertaRequest;
import br.com.railsense_backend.dto.response.AlertaDetalheResponse;
import br.com.railsense_backend.dto.response.AnaliseResponse;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AlertaService {

    /**
     * Acima deste score, NORMAL com score alto é tratado como contradição do modelo
     * (diz "normal", mas vê a imagem muito diferente da baseline) e vai para revisão humana.
     */
    static final float LIMIAR_INCONSISTENCIA = 0.8f;

    /** Score a partir do qual o nível sobe um degrau (ver determinarNivel e ImageAnalysisPrompt). */
    private final float limiarNivelAlto;

    private final AlertaRepository alertas;
    private final EvidenciaAlertaRepository evidencias;
    private final DecisaoAlertaRepository decisoes;
    private final UsuarioRepository usuarios;

    public AlertaService(AlertaRepository alertas, EvidenciaAlertaRepository evidencias,
            DecisaoAlertaRepository decisoes, UsuarioRepository usuarios,
            @Value("${app.alertas.limiar-nivel-alto:0.6}") float limiarNivelAlto) {
        this.alertas = alertas;
        this.evidencias = evidencias;
        this.decisoes = decisoes;
        this.usuarios = usuarios;
        this.limiarNivelAlto = limiarNivelAlto;
    }

    public Optional<Alerta> avaliarEGerarAlerta(Analise analise) {
        analise.setLimiarUtilizado(limiarNivelAlto);
        NivelAlerta nivel = determinarNivel(analise.getClassificacao(), analise.getScoreDiferenca());
        if (nivel == null) {
            return Optional.empty();
        }

        Alerta alerta = alertas.save(Alerta.builder()
            .analise(analise)
            .eixo(analise.getImagemAtual().getEixo())
            .nivel(nivel)
            .status(StatusAlerta.EM_ANALISE)
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
            AnaliseResponse.regioes(analise),
            evidencias.findByAlertaId(alertaId).stream().map(EvidenciaResponse::from).toList(),
            decisoes.findByAlertaIdOrderByCriadoEmAsc(alertaId).stream().map(DecisaoAlertaResponse::from).toList());
    }

    @Transactional
    public DecisaoAlertaResponse decidir(Long alertaId, Long usuarioId, DecisaoAlertaRequest request) {
        Alerta alerta = alertas.findByIdForUpdate(alertaId).orElseThrow(() -> new AlertaNotFoundException(alertaId));
        if (alerta.getStatus() != StatusAlerta.EM_ANALISE) {
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

    /**
     * A classificação define a gravidade base; o score (escala ancorada no prompt) sobe um degrau
     * quando a diferença é compatível com vazamento. Viés conservador: num rolamento ferroviário,
     * deixar passar um vazamento custa muito mais que um alarme a mais revisado por um engenheiro.
     *
     *   VAZAMENTO: score >= limiar -> CRITICO, abaixo -> MEDIO
     *   SUSPEITO:  score >= limiar -> MEDIO,   abaixo -> BAIXO
     *   NORMAL:    score >= 0.8    -> BAIXO (contradição do modelo), abaixo -> sem alerta
     */
    NivelAlerta determinarNivel(Classificacao classificacao, Float score) {
        float valor = score != null ? score : 0f;
        boolean acimaDoLimiar = valor >= limiarNivelAlto;
        return switch (classificacao) {
            case NORMAL -> valor >= LIMIAR_INCONSISTENCIA ? NivelAlerta.BAIXO : null;
            case SUSPEITO -> acimaDoLimiar ? NivelAlerta.MEDIO : NivelAlerta.BAIXO;
            case VAZAMENTO -> acimaDoLimiar ? NivelAlerta.CRITICO : NivelAlerta.MEDIO;
        };
    }

    private static EvidenciaAlerta evidencia(Alerta alerta, Imagem imagem, TipoEvidencia tipo) {
        return EvidenciaAlerta.builder().alerta(alerta).imagem(imagem).tipo(tipo).build();
    }
}
