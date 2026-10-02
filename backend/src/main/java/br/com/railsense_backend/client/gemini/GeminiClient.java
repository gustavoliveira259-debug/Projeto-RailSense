package br.com.railsense_backend.client.gemini;

import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import br.com.railsense_backend.exception.GeminiAnalysisException;

@Service
public class GeminiClient {

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public GeminiClient(RestClient.Builder builder,
            @Value("${app.gemini.api-key}") String apiKey,
            @Value("${app.gemini.model}") String model) {
        this.apiKey = apiKey;
        this.model = model;
        this.restClient = builder.baseUrl("https://generativelanguage.googleapis.com").build();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> compareImages(byte[] baselineBytes, String baselineMime,
            byte[] currentBytes, String currentMime, String prompt) {

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(
                    Map.of("text", "Imagem de referência (baseline):"),
                    Map.of("inlineData", Map.of("mimeType", baselineMime, "data", encode(baselineBytes))),
                    Map.of("text", "Imagem atual a ser comparada:"),
                    Map.of("inlineData", Map.of("mimeType", currentMime, "data", encode(currentBytes))),
                    Map.of("text", prompt)
                )
            )),
            "generationConfig", Map.of("responseMimeType", "application/json")
        );

        try {
            return restClient.post()
                .uri("/v1beta/models/{model}:generateContent", model)
                .header("x-goog-api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(Map.class);
        } catch (Exception e) {
            throw new GeminiAnalysisException("Falha ao chamar a API do Gemini", e);
        }
    }

    private String encode(byte[] bytes) {
        return Base64.getEncoder().encodeToString(bytes);
    }
}