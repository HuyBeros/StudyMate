package com.huyberos.studymate.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Offline Fallback Provider — tạo response mẫu khi tất cả AI API đều thất bại.
 * Đảm bảo ứng dụng không bao giờ crash/treo vì thiếu AI.
 */
@Slf4j
@Component
public class OfflineFallbackProvider implements AiProvider {

    @Override
    public String getName() {
        return "Offline Fallback";
    }

    @Override
    public boolean isAvailable() {
        return true; // Luôn sẵn sàng
    }

    @Override
    public String generateContent(String prompt, boolean forceJson) {
        log.warn("[Offline Fallback] Generating local fallback response");
        if (!forceJson) {
            return generateMarkdownSummary();
        }
        return generateFallbackJson(prompt);
    }

    @Override
    public String generateContentWithImage(String prompt, String mimeType, byte[] imageBytes, boolean forceJson) {
        log.warn("[Offline Fallback] Image processing not available offline");
        return generateContent(prompt, forceJson);
    }

    // ── Private helpers ─────────────────────────────────────

    private String generateMarkdownSummary() {
        return """
                # 📌 Tóm tắt bài học (Smart Summary)
                
                ## 1. Khái niệm & Trọng tâm cốt lõi:
                - Bài học tập trung vào các định lý, công thức và nguyên lý ứng dụng thực tế.
                - Cần ghi nhớ kỹ các định nghĩa cơ bản và quy trình xử lý bài tập.
                
                ## 2. Gợi ý ôn tập:
                - Thực hành làm lại các bài tập ví dụ trong giáo trình.
                - Kiểm tra kiến thức bằng bộ câu hỏi trắc nghiệm Quiz AI.
                """;
    }

    private String generateFallbackJson(String prompt) {
        if (prompt.contains("questionText") || prompt.contains("trắc nghiệm")) {
            return generateQuizFallback();
        }
        return generateMindmapFallback();
    }

    private String generateQuizFallback() {
        return """
                [
                  {
                    "questionText": "Nội dung cốt lõi của bài học/tài liệu này là gì?",
                    "optionA": "Nắm vững lý thuyết cơ bản và phương pháp ứng dụng",
                    "optionB": "Chỉ học thuộc lòng định nghĩa",
                    "optionC": "Bỏ qua các ví dụ minh họa",
                    "optionD": "Không cần thực hành bài tập",
                    "correctOption": "A",
                    "explanation": "Hiểu rõ lý thuyết cốt lõi và áp dụng thực hành là chìa khóa ghi nhớ lâu dài."
                  },
                  {
                    "questionText": "Phương pháp học tập hiệu quả nhất cho chủ đề này là gì?",
                    "optionA": "Học ngắt quãng và vẽ sơ đồ tư duy",
                    "optionB": "Học nhồi nhét trước kỳ thi",
                    "optionC": "Đọc lướt qua một lần",
                    "optionD": "Không ghi chép bài",
                    "correctOption": "A",
                    "explanation": "Kỹ thuật Spaced Repetition và Mindmap giúp tối ưu hóa khả năng ghi nhớ của não bộ."
                  }
                ]
                """;
    }

    private String generateMindmapFallback() {
        return """
                {
                  "id": "root",
                  "label": "Chủ đề học tập",
                  "children": [
                    {
                      "id": "node-1",
                      "label": "1. Khái niệm cơ bản",
                      "children": [
                        { "id": "node-1-1", "label": "Định nghĩa & Tính chất" },
                        { "id": "node-1-2", "label": "Công thức cốt lõi" }
                      ]
                    },
                    {
                      "id": "node-2",
                      "label": "2. Ứng dụng thực hành",
                      "children": [
                        { "id": "node-2-1", "label": "Các dạng bài tập tiêu biểu" },
                        { "id": "node-2-2", "label": "Lưu ý tránh sai sót" }
                      ]
                    }
                  ]
                }
                """;
    }
}
