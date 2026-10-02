package br.com.railsense_backend.service;

import br.com.railsense_backend.enums.Classificacao;
import br.com.railsense_backend.enums.NivelAlerta;
import br.com.railsense_backend.enums.StatusAlerta;
import br.com.railsense_backend.models.Alerta;
import br.com.railsense_backend.models.Analise;
import br.com.railsense_backend.repository.AlertaRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AlertaService {

    private static final float LIMIAR_NIVEL_ALTO = 0.7f;

    private final AlertaRepository alertas;

    public AlertaService(AlertaRepository alertas) {
        this.alertas = alertas;
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

        return Optional.of(alerta);
    }

    private NivelAlerta determinarNivel(Classificacao classificacao, Float score) {
        float valor = score != null ? score : 0f;
        return switch (classificacao) {
            case NORMAL -> null;
            case SUSPEITO -> valor >= LIMIAR_NIVEL_ALTO ? NivelAlerta.MEDIO : NivelAlerta.BAIXO;
            case VAZAMENTO -> valor >= LIMIAR_NIVEL_ALTO ? NivelAlerta.CRITICO : NivelAlerta.MEDIO;
        };
    }
}