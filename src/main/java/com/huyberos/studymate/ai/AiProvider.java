package com.huyberos.studymate.ai;

/**
 * Interface chung cho tất cả AI Provider (Gemini, Groq, OpenAI, Offline).
 * Mỗi provider chỉ tập trung vào 1 API duy nhất — tuân thủ Single Responsibility.
 */
public interface AiProvider {

    /**
     * Tên provider (dùng cho logging).
     */
    String getName();

    /**
     * Kiểm tra provider có sẵn sàng (có API key) không.
     */
    boolean isAvailable();

    /**
     * Tạo nội dung text từ prompt.
     *
     * @param prompt    Prompt gửi đến AI
     * @param forceJson Yêu cầu AI trả về JSON
     * @return Response text từ AI
     * @throws Exception nếu gọi API thất bại
     */
    String generateContent(String prompt, boolean forceJson) throws Exception;

    /**
     * Tạo nội dung text từ prompt kèm hình ảnh.
     * Trả về null nếu provider không hỗ trợ vision.
     *
     * @param prompt     Prompt gửi đến AI
     * @param mimeType   MIME type của ảnh (image/png, image/jpeg, ...)
     * @param imageBytes Raw bytes của ảnh
     * @param forceJson  Yêu cầu AI trả về JSON
     * @return Response text từ AI
     * @throws Exception nếu gọi API thất bại
     */
    String generateContentWithImage(String prompt, String mimeType, byte[] imageBytes, boolean forceJson) throws Exception;
}
