package br.com.railsense_backend.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import br.com.railsense_backend.enums.Classificacao;
import br.com.railsense_backend.models.Analise;

/** Uma comparação imagem atual x baseline feita pelo Gemini (sem a resposta bruta). */
public record AnaliseResponse(
    Long id,
    Long imagemAtualId,
    String urlImagemAtual,
    Long imagemBaselineId,
    Classificacao classificacao,
    Float scoreDiferenca,
    List<String> regioesAnomalia,
    Instant criadoEm
) {
    public static AnaliseResponse from(Analise a) {
        return new AnaliseResponse(a.getId(), a.getImagemAtual().getId(), a.getImagemAtual().getUrlArquivo(),
            a.getImagemBaseline().getId(), a.getClassificacao(), a.getScoreDiferenca(), regioes(a), a.getCriadoEm());
    }

    /** As regiões são gravadas em JSONB como {"regioes": [...]} (ver ImageService). */
    @SuppressWarnings("unchecked")
    public static List<String> regioes(Analise analise) {
        if (analise == null || analise.getRegioesAnomalia() == null) {
            return List.of();
        }
        Object regioes = ((Map<String, Object>) analise.getRegioesAnomalia()).get("regioes");
        return regioes instanceof List<?> lista ? (List<String>) lista : List.of();
    }
}
