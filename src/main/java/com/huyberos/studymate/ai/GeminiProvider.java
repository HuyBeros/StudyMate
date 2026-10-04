package com.huyberos.studymate.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * Gemini AI Provider — gọi Google Gemini 2.0 Flash API.
 * Fix bảo mật: dùng header x-goog-api-key thay vì query string ?key=.
 */
@Slf4j
@Component
public class GeminiProvider implements AiProvider {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent}")
    private String apiUrl;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GeminiProvider(RestClient aiRestClient, ObjectMapper objectMapper) {
        this.restClient = aiRestClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String getName() {
        return "Gemini";
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public String generateContent(String prompt, boolean forceJson) throws Exception {
        return callGemini(prompt, forceJson, null);
    }

    /**
     * Hỗ trợ responseSchema cho structured output (dùng bởi AiRouter.generateContentWithSchema).
     */
    public String generateContentWithSchema(String prompt, boolean forceJson, Map<String, Object> responseSchema) throws Exception {
        return callGemini(prompt, forceJson, responseSchema);
    }

    @Override
    public String generateContentWithImage(String prompt, String mimeType, byte[] imageBytes, boolean forceJson) throws Exception {
        String cleanKey = apiKey != null ? apiKey.trim() : "";
        String targetUrl = buildTargetUrl(cleanKey);
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> imagePart = Map.of("inlineData", Map.of("mimeType", mimeType, "data", base64Image));
        Map<String, Object> content = Map.of("parts", List.of(textPart, imagePart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));

        if (forceJson) {
            requestBody.put("generationConfig", Map.of("response_mime_type", "application/json"));
        }

        String rawResponse = restClient.post()
                .uri(targetUrl)
                .header("x-goog-api-key", cleanKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        return extractTextFromGeminiResponse(rawResponse);
    }

    // ── Private helpers ─────────────────────────────────────

    private String callGemini(String prompt, boolean forceJson, Map<String, Object> responseSchema) throws Exception {
        String cleanKey = apiKey != null ? apiKey.trim() : "";
        String targetUrl = buildTargetUrl(cleanKey);

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));

        if (forceJson) {
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("response_mime_type", "application/json");
            if (responseSchema != null && !responseSchema.isEmpty()) {
                generationConfig.put("response_schema", responseSchema);
            }
            requestBody.put("generationConfig", generationConfig);
        }

        String rawResponse = restClient.post()
                .uri(targetUrl)
                .header("x-goog-api-key", cleanKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        return extractTextFromGeminiResponse(rawResponse);
    }

    private String buildTargetUrl(String cleanKey) {
        String url = apiUrl;
        if (!url.contains("key=") && !cleanKey.isBlank()) {
            url = url + (url.contains("?") ? "&" : "?") + "key=" + cleanKey;
        }
        return url;
    }

    private String extractTextFromGeminiResponse(String jsonResponse) throws Exception {
        JsonNode root = objectMapper.readTree(jsonResponse);
        JsonNode candidates = root.path("candidates");
        if (candidates.isArray() && !candidates.isEmpty()) {
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (parts.isArray() && !parts.isEmpty()) {
                return parts.get(0).path("text").asText();
            }
        }
        throw new IllegalStateException("Empty content in Gemini response");
    }
}
