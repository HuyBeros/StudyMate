package com.huyberos.studymate.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * OpenAI Provider — sử dụng GPT models qua OpenAI API.
 * Model names externalize vào application.properties để dễ upgrade.
 */
@Component
public class OpenAiProvider extends OpenAiCompatibleProvider {

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    @Value("${openai.vision-model:gpt-4o-mini}")
    private String visionModel;

    public OpenAiProvider(RestClient aiRestClient, ObjectMapper objectMapper) {
        super(aiRestClient, objectMapper);
    }

    @Override
    public String getName() {
        return "OpenAI";
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
