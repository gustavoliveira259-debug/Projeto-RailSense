package br.com.railsense_backend.client.gemini;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;

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
    public Map<String, Object> analyzeImage(byte[] imageBytes, String mimeType, String prompt) {
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(
                    Map.of("inlineData", Map.of("mimeType", mimeType, "data", base64Image)),
                    Map.of("text", prompt)
                )
            ))
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
}