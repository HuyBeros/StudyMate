package com.huyberos.studymate.util;

import com.huyberos.studymate.entity.enums.CorrectOption;
import lombok.extern.slf4j.Slf4j;

/**
 * Utility class cho các hàm xử lý text dùng chung giữa AiService, AsyncJobService, AiOutputService.
 * Loại bỏ code duplicate (DRY violation).
 */
@Slf4j
public final class AiTextUtil {

    private AiTextUtil() {
        // Prevent instantiation
    }

    /**
     * Cắt nội dung text nếu vượt quá maxLength, thêm chú thích cắt bớt.
     *
     * @param text      Nội dung gốc
     * @param maxLength Độ dài tối đa cho phép
     * @return text đã cắt (hoặc nguyên bản nếu chưa vượt giới hạn)
     */
    public static String truncateContent(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength) + "\n...[Nội dung đã cắt bớt]";
    }

    /**
     * Parse chuỗi đáp án từ AI response sang CorrectOption enum.
     * Log warning khi phải fallback — tránh silent failure gây quiz có đáp án sai.
     *
     * @param str Chuỗi đáp án (A, B, C, D)
     * @return CorrectOption enum
     */
    public static CorrectOption parseCorrectOption(String str) {
        if (str == null) {
            log.warn("correctOption is null from AI response, defaulting to A");
            return CorrectOption.A;
        }
        String clean = str.trim().toUpperCase();
        try {
            return CorrectOption.valueOf(clean);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid correctOption '{}' from AI response, defaulting to A", str);
            return CorrectOption.A;
        }
    }
}
