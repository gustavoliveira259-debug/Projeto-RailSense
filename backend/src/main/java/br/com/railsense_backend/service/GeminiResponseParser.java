package br.com.railsense_backend.service;

import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

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
            return new ParsedAnalysis(
                (String) parsed.get("classificacao"),
                ((Number) parsed.get("score_diferenca")).floatValue(),
                (List<String>) parsed.get("regioes_anomalia")
            );
        } catch (Exception e) {
            throw new br.com.railsense_backend.exception.GeminiAnalysisException(
                "Falha ao interpretar resposta do Gemini", e);
        }
    }

    public record ParsedAnalysis(String classificacao, Float scoreDiferenca, List<String> regioesAnomalia) {}
}