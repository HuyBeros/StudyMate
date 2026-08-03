package com.huyberos.studymate.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.huyberos.studymate.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GeminiClient {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent}")
    private String apiUrl;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GeminiClient(ObjectMapper objectMapper) {
        this.restClient = RestClient.create();
        this.objectMapper = objectMapper;
    }

    /**
     * Gọi Gemini 2.0 Flash API để sinh văn bản hoặc JSON.
     */
    public String generateContent(String prompt, boolean forceJson) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BadRequestException("Gemini API key is missing. Please set GEMINI_API_KEY environment variable.");
        }

        String fullUrl = apiUrl + "?key=" + apiKey;

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));

        Map<String, Object> requestBody;
        if (forceJson) {
            Map<String, Object> generationConfig = Map.of("response_mime_type", "application/json");
            requestBody = Map.of(
                    "contents", List.of(content),
                    "generationConfig", generationConfig
            );
        } else {
            requestBody = Map.of("contents", List.of(content));
        }

        try {
            String rawResponse = restClient.post()
                    .uri(fullUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            return extractTextFromGeminiResponse(rawResponse);

        } catch (Exception e) {
            log.error("Failed to call Gemini API: {}", e.getMessage(), e);
            throw new BadRequestException("Error communicating with Gemini AI: " + e.getMessage());
        }
    }

    private String extractTextFromGeminiResponse(String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText();
                }
            }
            throw new BadRequestException("Empty or invalid response structure from Gemini AI");
        } catch (Exception e) {
            log.error("Error parsing Gemini response: {}", e.getMessage());
            throw new BadRequestException("Failed to parse Gemini response: " + e.getMessage());
        }
    }
}
