package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.request.QuizAttemptRequest;
import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.dto.response.MindmapResponse;
import com.huyberos.studymate.dto.response.QuizAttemptResponse;
import com.huyberos.studymate.dto.response.QuizResponse;
import com.huyberos.studymate.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    // ── Note AI Endpoints ──────────────────────────────────

    /**
     * POST /api/notes/{id}/summarize — Tóm tắt ghi chú bằng AI
     */
    @PostMapping("/notes/{id}/summarize")
    public ResponseEntity<ApiResponse<String>> summarizeNote(@PathVariable Long id) {
        String summary = aiService.summarizeNote(id);
        return ResponseEntity.ok(ApiResponse.ok("Note summarized successfully", summary));
    }

    /**
     * POST /api/notes/{id}/quiz — Sinh bộ câu hỏi trắc nghiệm từ ghi chú
     */
    @PostMapping("/notes/{id}/quiz")
    public ResponseEntity<ApiResponse<QuizResponse>> generateQuizFromNote(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") int numberOfQuestions) {
        QuizResponse quiz = aiService.generateQuizFromNote(id, numberOfQuestions);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Quiz generated successfully from note", quiz));
    }

    /**
     * POST /api/notes/{id}/mindmap — Sinh cây Mindmap từ ghi chú
     */
    @PostMapping("/notes/{id}/mindmap")
    public ResponseEntity<ApiResponse<MindmapResponse>> generateMindmapFromNote(@PathVariable Long id) {
        MindmapResponse mindmap = aiService.generateMindmapFromNote(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Mindmap generated successfully from note", mindmap));
    }

    // ── Document AI Endpoints ──────────────────────────────

    /**
     * POST /api/documents/{id}/summarize — Tóm tắt tài liệu PDF/DOCX bằng AI
     */
    @PostMapping("/documents/{id}/summarize")
    public ResponseEntity<ApiResponse<String>> summarizeDocument(@PathVariable Long id) {
        String summary = aiService.summarizeDocument(id);
        return ResponseEntity.ok(ApiResponse.ok("Document summarized successfully", summary));
    }

    /**
     * POST /api/documents/{id}/quiz — Sinh bộ câu hỏi trắc nghiệm từ tài liệu
     */
    @PostMapping("/documents/{id}/quiz")
    public ResponseEntity<ApiResponse<QuizResponse>> generateQuizFromDocument(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") int numberOfQuestions) {
        QuizResponse quiz = aiService.generateQuizFromDocument(id, numberOfQuestions);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Quiz generated successfully from document", quiz));
    }

    /**
     * POST /api/documents/{id}/mindmap — Sinh cây Mindmap từ tài liệu
     */
    @PostMapping("/documents/{id}/mindmap")
    public ResponseEntity<ApiResponse<MindmapResponse>> generateMindmapFromDocument(@PathVariable Long id) {
        MindmapResponse mindmap = aiService.generateMindmapFromDocument(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Mindmap generated successfully from document", mindmap));
    }

    // ── Quiz & Mindmap Viewer & Attempt ────────────────────

    /**
     * GET /api/quizzes/{id} — Lấy chi tiết bài Quiz
     */
    @GetMapping("/quizzes/{id}")
    public ResponseEntity<ApiResponse<QuizResponse>> getQuizById(@PathVariable Long id) {
        QuizResponse quiz = aiService.getQuizById(id);
        return ResponseEntity.ok(ApiResponse.ok(quiz));
    }

    /**
     * POST /api/quizzes/{id}/attempt — Nộp bài làm Quiz & nhận kết quả chấm điểm
     */
    @PostMapping("/quizzes/{id}/attempt")
    public ResponseEntity<ApiResponse<QuizAttemptResponse>> attemptQuiz(
            @PathVariable Long id,
            @Valid @RequestBody QuizAttemptRequest request) {
        QuizAttemptResponse result = aiService.attemptQuiz(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Quiz submitted and evaluated", result));
    }

    /**
     * GET /api/mindmaps/{id} — Lấy chi tiết cây Mindmap
     */
    @GetMapping("/mindmaps/{id}")
    public ResponseEntity<ApiResponse<MindmapResponse>> getMindmapById(@PathVariable Long id) {
        MindmapResponse mindmap = aiService.getMindmapById(id);
        return ResponseEntity.ok(ApiResponse.ok(mindmap));
    }
}
