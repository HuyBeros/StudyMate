package com.huyberos.studymate.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Groq AI Provider — sử dụng Llama models qua OpenAI-compatible API.
 * Model names externalize vào application.properties để dễ upgrade.
 */
@Component
public class GroqProvider extends OpenAiCompatibleProvider {

    @Value("${groq.api.key:}")
    private String apiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String apiUrl;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String model;

    @Value("${groq.vision-model:llama-3.2-11b-vision-preview}")
    private String visionModel;

    public GroqProvider(RestClient aiRestClient, ObjectMapper objectMapper) {
        super(aiRestClient, objectMapper);
    }

    @Override
    public String getName() {
        return "Groq";
    }

    @Override
    protected String getApiKey() {
        return apiKey;
    }

    @Override
    protected String getApiUrl() {
        return apiUrl;
    }

    @Override
    protected String getModel() {
        return model;
    }

    @Override
    protected String getVisionModel() {
        return visionModel;
    }
}
