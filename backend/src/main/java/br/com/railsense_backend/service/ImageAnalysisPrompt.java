package br.com.railsense_backend.service;

public final class ImageAnalysisPrompt {

    public static final String COMPARACAO_BASELINE = """
        Você é um sistema de inspeção visual para eixos de vagões ferroviários.
        Compare a imagem de referência (baseline, estado normal conhecido) com a
        imagem atual do mesmo eixo. Procure sinais de vazamento (manchas de óleo
        ou graxa, gotejamento, acúmulo de líquido) ou qualquer anomalia visual
        relevante que não esteja presente na baseline.

        Responda apenas em JSON, no seguinte formato exato:
        {
          "classificacao": "NORMAL" | "SUSPEITO" | "VAZAMENTO",
          "score_diferenca": <número entre 0.0 e 1.0, quanto maior mais diferente da baseline>,
          "regioes_anomalia": [<lista curta de strings descrevendo onde e o que foi observado, vazia se normal>]
        }
        """;

    private ImageAnalysisPrompt() {}
}