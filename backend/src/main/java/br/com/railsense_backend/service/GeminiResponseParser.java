package br.com.railsense_backend.service;

import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import br.com.railsense_backend.enums.Classificacao;

@Component
public class GeminiResponseParser {

    private final ObjectMapper objectMapper;

    public GeminiResponseParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @SuppressWarnings("unchecked")
    public ParsedAnalysis parse(Map<String, Object> geminiResponse) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) geminiResponse.get("candidates");
            Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
            List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
            String jsonText = (String) parts.get(0).get("text");

            Map<String, Object> parsed = objectMapper.readValue(jsonText, Map.class);
            Classificacao classificacao = Classificacao.valueOf(
                ((String) parsed.get("classificacao")).trim().toUpperCase(Locale.ROOT));
            float score = ((Number) parsed.get("score_diferenca")).floatValue();
            if (score < 0f || score > 1f) {
                throw new IllegalArgumentException("score_diferenca fora de [0, 1]: " + score);
            }
            List<String> regioes = (List<String>) parsed.get("regioes_anomalia");
            return new ParsedAnalysis(classificacao, score, regioes != null ? regioes : List.of());
        } catch (Exception e) {
            throw new br.com.railsense_backend.exception.GeminiAnalysisException(
                "Falha ao interpretar resposta do Gemini", e);
        }
    }

    public record ParsedAnalysis(Classificacao classificacao, Float scoreDiferenca, List<String> regioesAnomalia) {}
}