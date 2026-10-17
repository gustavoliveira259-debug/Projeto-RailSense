package br.com.railsense_backend.dto.response;

import java.time.Instant;
import java.util.List;

import br.com.railsense_backend.enums.Classificacao;

/** Campos da análise ficam nulos quando a imagem não foi comparada (ex.: não havia baseline). */
public record ImagemResponse(
    Long id,
    String urlArquivo,
    Instant timestampCaptura,
    boolean ehBaseline,
    boolean baselineAtiva,
    Classificacao classificacao,
    Float scoreDiferenca,
    List<String> regioesAnomalia,
    Long alertaId
) {}
