package com.huyberos.studymate.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * AI Router — điều phối request đến các AI provider theo thứ tự ưu tiên.
 * Fallback chain: Gemini → Groq → OpenAI → Offline.
 *
 * Thay thế GeminiClient cũ (God Class 264 dòng) bằng kiến trúc Strategy Pattern sạch.
 * Tất cả service nên inject AiRouter thay vì inject từng client riêng lẻ.
 */
@Slf4j
@Component
public class AiRouter {

    private final List<AiProvider> providers;
    private final OfflineFallbackProvider fallback;
    private final GeminiProvider geminiProvider;

    public AiRouter(GeminiProvider geminiProvider,
                    GroqProvider groqProvider,
                    OpenAiProvider openAiProvider,
                    OfflineFallbackProvider fallback) {
        this.geminiProvider = geminiProvider;
        this.providers = List.of(geminiProvider, groqProvider, openAiProvider);
        this.fallback = fallback;
    }

    /**
     * Tạo nội dung text — tự động fallback qua các provider.
     */
    public String generateContent(String prompt, boolean forceJson) {
        return tryGenerateContent(prompt, forceJson).orElseGet(() -> {
            log.warn("[AI Router] All providers failed. Using offline fallback.");
            return fallback.generateContent(prompt, forceJson);
        });
    }

    public Optional<String> tryGenerateContent(String prompt, boolean forceJson) {
        for (AiProvider provider : providers) {
            if (!provider.isAvailable()) continue;
            try {
                log.info("[AI Router] Trying {}...", provider.getName());
                String result = provider.generateContent(prompt, forceJson);
                if (result != null && !result.isBlank()) return Optional.of(result);
            } catch (Exception e) {
                log.warn("[AI Router] {} failed: {}. Falling back...", provider.getName(), e.getMessage());
            }
        }
        return Optional.empty();
    }

    /**
     * Tạo nội dung text với response schema (chỉ Gemini hỗ trợ).
     * Fallback sang generateContent thường nếu Gemini không khả dụng.
     */
    public String generateContentWithSchema(String prompt, boolean forceJson, Map<String, Object> responseSchema) {
        if (geminiProvider.isAvailable()) {
            try {
                log.info("[AI Router] Trying Gemini with schema...");
                return geminiProvider.generateContentWithSchema(prompt, forceJson, responseSchema);
            } catch (Exception e) {
                log.warn("[AI Router] Gemini schema call failed: {}. Falling back...", e.getMessage());
            }
        }
        // Schema không được hỗ trợ bởi Groq/OpenAI → fallback sang generateContent thường
        return generateContent(prompt, forceJson);
    }

    /**
     * Tạo nội dung text từ prompt + hình ảnh — tự động fallback.
     */
    public String generateContentWithImage(String prompt, String mimeType, byte[] imageBytes, boolean forceJson) {
        for (AiProvider provider : providers) {
            if (!provider.isAvailable()) continue;
            try {
                log.info("[AI Router] Trying {} for image processing...", provider.getName());
                return provider.generateContentWithImage(prompt, mimeType, imageBytes, forceJson);
            } catch (Exception e) {
                log.warn("[AI Router] {} image processing failed: {}. Falling back...", provider.getName(), e.getMessage());
            }
        }
        log.warn("[AI Router] All providers failed for image processing. Using offline fallback.");
        return fallback.generateContentWithImage(prompt, mimeType, imageBytes, forceJson);
    }
}
