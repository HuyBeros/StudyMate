package com.huyberos.studymate.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.huyberos.studymate.ai.GeminiClient;
import com.huyberos.studymate.dto.response.MindmapResponse;
import com.huyberos.studymate.dto.response.QuizResponse;
import com.huyberos.studymate.entity.*;
import com.huyberos.studymate.entity.enums.CorrectOption;
import com.huyberos.studymate.entity.enums.JobStatus;
import com.huyberos.studymate.entity.enums.SourceType;
import com.huyberos.studymate.dto.request.AiConfigRequest;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncJobService {

    private final AsyncJobRepository asyncJobRepository;
    private final JobStatusService jobStatusService;   // <- dùng bean riêng để cập nhật status
    private final GeminiClient geminiClient;
    private final NoteRepository noteRepository;
    private final DocumentRepository documentRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final MindmapRepository mindmapRepository;
    private final ObjectMapper objectMapper;
    private final CacheManager cacheManager;

    /**
     * Khởi tạo một AsyncJob mới với UUID.
     */
    @Transactional
    public AsyncJob createJob(Long userId, String jobType) {
        String jobId = UUID.randomUUID().toString().replace("-", "");
        AsyncJob job = AsyncJob.builder()
                .jobId(jobId)
                .userId(userId)
                .jobType(jobType)
                .status(JobStatus.PENDING)
                .build();
        return asyncJobRepository.save(job);
    }

    /**
     * Lấy trạng thái Job hiện tại.
     */
    @Transactional(readOnly = true)
    public AsyncJob getJobStatus(String jobId, Long userId) {
        return asyncJobRepository.findByJobIdAndUserId(jobId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));
    }

    // ── 1. ASYNC QUIZ GENERATION ────────────────────────────

    /**
     * KHÔNG dùng @Transactional ở đây vì:
     * - @Async tạo thread mới → transaction cũ không lan sang
     * - Nếu Gemini ném RuntimeException bên trong, transaction bị rollback-only
     *   → lệnh updateStatus(FAILED) trong catch cũng bị rollback
     * - Thay vào đó, jobStatusService.updateStatus() dùng REQUIRES_NEW
     *   để mỗi status update là một transaction độc lập, commit ngay lập tức.
     */
    @Async("aiTaskExecutor")
    public void processQuizGeneration(String jobId, SourceType sourceType, Long sourceId, String title, String content, AiConfigRequest config) {
        log.info("[AsyncJob] Starting Quiz Generation for jobId: {}, title: {}", jobId, title);
        jobStatusService.updateStatus(jobId, JobStatus.PROCESSING, null, null);

        try {
            int numQ = config.getNumberOfQuestions() != null && config.getNumberOfQuestions() > 0 ? Math.min(config.getNumberOfQuestions(), 20) : 5;
            String diff = config.getDifficulty() != null ? config.getDifficulty() : "Trung bình";
            String lang = config.getLanguage() != null ? config.getLanguage() : "Tiếng Việt";
            String focus = config.getFocusAreas() != null && !config.getFocusAreas().isBlank() ? "Tập trung vào: " + config.getFocusAreas() : "";

            String prompt = """
                    Bạn là chuyên gia ra đề thi. Hãy tạo bộ %d câu hỏi trắc nghiệm bằng %s từ nội dung sau.
                    Độ khó: %s. %s
                    Trả về DUY NHẤT một JSON Array chứa các object câu hỏi theo đúng cấu trúc sau:
                    [
                      {
                        "questionText": "Nội dung câu hỏi?",
                        "optionA": "Đáp án A",
                        "optionB": "Đáp án B",
                        "optionC": "Đáp án C",
                        "optionD": "Đáp án D",
                        "correctOption": "A",
                        "explanation": "Giải thích ngắn gọn vì sao đáp án đúng"
                      }
                    ]

                    Nội dung tài liệu/bài học:
                    %s
                    """.formatted(numQ, lang, diff, focus, truncateContent(content, 15000));

            String jsonResponse = geminiClient.generateContent(prompt, true);
            List<Map<String, String>> rawQuestions = objectMapper.readValue(jsonResponse, new TypeReference<>() {});

            Map<String, Object> result = new HashMap<>();
            result.put("title", "Trắc nghiệm: " + title);
            result.put("questions", rawQuestions);
            result.put("sourceType", sourceType.name());
            result.put("sourceId", sourceId);

            String resultJson = objectMapper.writeValueAsString(result);

            jobStatusService.updateStatus(jobId, JobStatus.COMPLETED, resultJson, null);
            log.info("[AsyncJob] Quiz Generation COMPLETED for jobId: {}", jobId);

        } catch (Exception e) {
            log.error("[AsyncJob] Quiz Generation FAILED for jobId: {}", jobId, e);
            jobStatusService.updateStatus(jobId, JobStatus.FAILED, null,
                    "AI đang bận hoặc tạo định dạng không hợp lệ, vui lòng thử lại sau 30 giây.");
        }
    }

    // ── 2. ASYNC MINDMAP GENERATION ─────────────────────────

    @Async("aiTaskExecutor")
    public void processMindmapGeneration(String jobId, SourceType sourceType, Long sourceId, String title, String content, AiConfigRequest config) {
        log.info("[AsyncJob] Starting Mindmap Generation for jobId: {}, title: {}", jobId, title);
        jobStatusService.updateStatus(jobId, JobStatus.PROCESSING, null, null);

        try {
            String lang = config.getLanguage() != null ? config.getLanguage() : "Tiếng Việt";
            String focus = config.getFocusAreas() != null && !config.getFocusAreas().isBlank() ? "Tập trung vào: " + config.getFocusAreas() : "";

            String prompt = """
                    Hãy phân tích nội dung sau và chuyển thành cây Mindmap bằng %s theo định dạng JSON. %s
                    JSON phải có cấu trúc cây lồng nhau như sau:
                    {
                      "id": "root",
                      "label": "Tên chủ đề chính",
                      "children": [
                        {
                          "id": "node-1",
                          "label": "Nhánh 1",
                          "children": [
                            { "id": "node-1-1", "label": "Ý chi tiết 1.1" }
                          ]
                        }
                      ]
                    }

                    Nội dung tài liệu/bài học:
                    %s
                    """.formatted(lang, focus, truncateContent(content, 15000));

            String jsonResponse = geminiClient.generateContent(prompt, true);
            Map<String, Object> structure = objectMapper.readValue(jsonResponse, new TypeReference<>() {});

            Map<String, Object> result = new HashMap<>();
            result.put("title", "Mindmap: " + title);
            result.put("structure", structure);
            result.put("sourceType", sourceType.name());
            result.put("sourceId", sourceId);

            String resultJson = objectMapper.writeValueAsString(result);

            jobStatusService.updateStatus(jobId, JobStatus.COMPLETED, resultJson, null);
            log.info("[AsyncJob] Mindmap Generation COMPLETED for jobId: {}", jobId);

        } catch (Exception e) {
            log.error("[AsyncJob] Mindmap Generation FAILED for jobId: {}", jobId, e);
            jobStatusService.updateStatus(jobId, JobStatus.FAILED, null,
                    "AI đang bận hoặc tạo cấu trúc Mindmap không hợp lệ.");
        }
    }

    // ── 3. ASYNC SUMMARY GENERATION ─────────────────────────

    @Async("aiTaskExecutor")
    public void processSummaryGeneration(String jobId, SourceType sourceType, Long sourceId, String title, String content, AiConfigRequest config) {
        log.info("[AsyncJob] Starting Summary Generation for jobId: {}, title: {}", jobId, title);
        jobStatusService.updateStatus(jobId, JobStatus.PROCESSING, null, null);

        try {
            String lang = config.getLanguage() != null ? config.getLanguage() : "Tiếng Việt";
            String focus = config.getFocusAreas() != null && !config.getFocusAreas().isBlank() ? "Tập trung vào: " + config.getFocusAreas() : "";

            String prompt = """
                    Bạn là một trợ lý học tập AI xuất sắc. Hãy tóm tắt nội dung sau thành các ý chính ngắn gọn, súc tích bằng %s. %s
                    Dùng bullet points (-), tô đậm các khái niệm quan trọng bằng markdown (**khái niệm**).

                    Tiêu đề: %s
                    Nội dung:
                    %s
                    """.formatted(lang, focus, title, truncateContent(content, 15000));

            String summary = geminiClient.generateContent(prompt, false);

            Map<String, Object> result = new HashMap<>();
            result.put("title", "Tóm tắt: " + title);
            result.put("summary", summary);
            result.put("sourceType", sourceType.name());
            result.put("sourceId", sourceId);

            String resultJson = objectMapper.writeValueAsString(result);

            jobStatusService.updateStatus(jobId, JobStatus.COMPLETED, resultJson, null);
            log.info("[AsyncJob] Summary Generation COMPLETED for jobId: {}", jobId);

        } catch (Exception e) {
            log.error("[AsyncJob] Summary Generation FAILED for jobId: {}", jobId, e);
            jobStatusService.updateStatus(jobId, JobStatus.FAILED, null,
                    "AI đang bận, không thể tạo tóm tắt vào lúc này.");
        }
    }

    // ── Helpers ────────────────────────────────────────────

    private String computeContentHash(String content) {
        if (content == null) return "empty";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return String.valueOf(content.hashCode());
        }
    }

    private String truncateContent(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength) + "\n...[Nội dung đã cắt bớt]";
    }

    private CorrectOption parseCorrectOption(String str) {
        if (str == null) return CorrectOption.A;
        String clean = str.trim().toUpperCase();
        try {
            return CorrectOption.valueOf(clean);
        } catch (IllegalArgumentException e) {
            return CorrectOption.A;
        }
    }
}
