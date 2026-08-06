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
public class GroqClient {

    @Value("${groq.api.key:}")
    private String apiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String apiUrl;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GroqClient(ObjectMapper objectMapper) {
        this.restClient = RestClient.create();
        this.objectMapper = objectMapper;
    }

    /**
     * Gọi Groq Chat Completion API (Llama-3.2-Vision) với prompt kèm theo dữ liệu hình ảnh (Base64).
     */
    public String generateContentWithImage(String prompt, String mimeType, byte[] imageBytes, boolean forceJson) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BadRequestException("Groq API key is missing. Please set GROQ_API_KEY environment variable.");
        }

        String base64Image = java.util.Base64.getEncoder().encodeToString(imageBytes);
        String dataUrl = "data:" + mimeType + ";base64," + base64Image;

        // Xây dựng cấu trúc body yêu cầu của Groq (Tương thích chuẩn OpenAI)
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

        Map<String, Object> requestBody;
        if (forceJson) {
            requestBody = Map.of(
                    "model", "llama-3.2-11b-vision-preview",
                    "messages", List.of(message),
                    "response_format", Map.of("type", "json_object")
            );
        } else {
            requestBody = Map.of(
                    "model", "llama-3.2-11b-vision-preview",
                    "messages", List.of(message)
            );
        }

        try {
            String rawResponse = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            return extractTextFromGroqResponse(rawResponse);

        } catch (Exception e) {
            log.error("Failed to call Groq API with image: {}", e.getMessage(), e);
            throw new BadRequestException("Error communicating with Groq AI: " + e.getMessage());
        }
    }

    private String extractTextFromGroqResponse(String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                JsonNode contentNode = choices.get(0).path("message").path("content");
                if (!contentNode.isMissingNode()) {
                    return contentNode.asText();
                }
            }
            throw new BadRequestException("Empty or invalid response structure from Groq AI");
        } catch (Exception e) {
            log.error("Error parsing Groq response: {}", e.getMessage());
            throw new BadRequestException("Failed to parse Groq response: " + e.getMessage());
        }
    }
}
