package com.huyberos.studymate.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * Abstract base class cho tất cả AI Provider sử dụng OpenAI ChatCompletions API format.
 * Áp dụng cho cả Groq và OpenAI — loại bỏ ~95% code duplicate.
 *
 * Subclass chỉ cần cung cấp config: API key, URL, model name.
 */
@Slf4j
public abstract class OpenAiCompatibleProvider implements AiProvider {

    protected final RestClient restClient;
    protected final ObjectMapper objectMapper;

    protected OpenAiCompatibleProvider(RestClient restClient, ObjectMapper objectMapper) {
        this.restClient = restClient;
        this.objectMapper = objectMapper;
    }

    protected abstract String getApiKey();
    protected abstract String getApiUrl();
    protected abstract String getModel();
    protected abstract String getVisionModel();

    @Override
    public boolean isAvailable() {
        return getApiKey() != null && !getApiKey().isBlank();
    }

    @Override
    public String generateContent(String prompt, boolean forceJson) throws Exception {
        Map<String, Object> systemMsg = Map.of("role", "system", "content",
                forceJson ? "You are a helpful AI study assistant. Output ONLY valid JSON matching requested format."
                          : "You are a helpful AI study assistant.");
        Map<String, Object> userMsg = Map.of("role", "user", "content", prompt);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", getModel());
        requestBody.put("messages", List.of(systemMsg, userMsg));
        requestBody.put("temperature", 0.5);

        if (forceJson) {
            requestBody.put("response_format", Map.of("type", "json_object"));
        }

        String rawResponse = restClient.post()
                .uri(getApiUrl())
                .header("Authorization", "Bearer " + getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        return extractContent(rawResponse);
    }

    @Override
    public String generateContentWithImage(String prompt, String mimeType, byte[] imageBytes, boolean forceJson) throws Exception {
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        String dataUrl = "data:" + mimeType + ";base64," + base64Image;

        Map<String, Object> textPart = Map.of(
                "type", "text",
                "text", prompt
        );
        Map<String, Object> imagePart = Map.of(
                "type", "image_url",
                "image_url", Map.of("url", dataUrl)
        );

        Map<String, Object> message = Map.of(
                "role", "user",
                "content", List.of(textPart, imagePart)
        );

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", getVisionModel());
        requestBody.put("messages", List.of(message));

        if (forceJson) {
            requestBody.put("response_format", Map.of("type", "json_object"));
        }

        String rawResponse = restClient.post()
                .uri(getApiUrl())
                .header("Authorization", "Bearer " + getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        return extractContent(rawResponse);
    }

    protected String extractContent(String jsonResponse) throws Exception {
        JsonNode root = objectMapper.readTree(jsonResponse);
        JsonNode choices = root.path("choices");
        if (choices.isArray() && !choices.isEmpty()) {
            JsonNode content = choices.get(0).path("message").path("content");
            if (!content.isMissingNode()) {
                return content.asText();
            }
        }
        throw new IllegalStateException("Empty response from " + getName());
    }
}
