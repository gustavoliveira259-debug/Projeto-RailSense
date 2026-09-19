package br.com.railsense_backend.dto.request;

import br.com.railsense_backend.enums.Classificacao;

public record ImageUploadResponse(
    Long imagemId,
    String urlArquivo,
    Long analiseId,
    Classificacao classificacao,
    Float scoreDiferenca
) {}
