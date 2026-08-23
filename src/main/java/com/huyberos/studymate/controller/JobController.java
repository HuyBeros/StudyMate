package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.entity.AsyncJob;
import com.huyberos.studymate.entity.Document;
import com.huyberos.studymate.entity.Note;
import com.huyberos.studymate.entity.enums.SourceType;
import com.huyberos.studymate.exception.BadRequestException;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.DocumentRepository;
import com.huyberos.studymate.repository.NoteRepository;
import com.huyberos.studymate.service.AsyncJobService;
import com.huyberos.studymate.util.SecurityUtil;
import com.huyberos.studymate.dto.request.AiConfigRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final AsyncJobService asyncJobService;
    private final NoteRepository noteRepository;
    private final DocumentRepository documentRepository;
    private final SecurityUtil securityUtil;

    /**
     * GET /api/jobs/{jobId} — Frontend polling 2s/lần để kiểm tra trạng thái job
     */
    @GetMapping("/{jobId}")
    public ResponseEntity<ApiResponse<AsyncJob>> getJobStatus(@PathVariable String jobId) {
        Long userId = securityUtil.getCurrentUserId();
        AsyncJob job = asyncJobService.getJobStatus(jobId, userId);
        return ResponseEntity.ok(ApiResponse.ok(job));
    }

    // ── Note Async Triggers ────────────────────────────────

    /**
     * POST /api/jobs/notes/{id}/quiz — Khởi tạo Async Job sinh Quiz từ Ghi chú
     */
    @PostMapping("/notes/{id}/quiz")
    public ResponseEntity<ApiResponse<Map<String, String>>> startNoteQuizJob(
            @PathVariable Long id,
            @RequestBody(required = false) AiConfigRequest config) {
        if (config == null) config = new AiConfigRequest();
        Long userId = securityUtil.getCurrentUserId();
        Note note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found: " + id));

        AsyncJob job = asyncJobService.createJob(userId, "QUIZ");
        asyncJobService.processQuizGeneration(job.getJobId(), SourceType.NOTE, note.getId(), note.getTitle(), note.getContent(), config);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok("Quiz generation job started", Map.of("jobId", job.getJobId())));
    }

    /**
     * POST /api/jobs/notes/{id}/mindmap — Khởi tạo Async Job sinh Mindmap từ Ghi chú
     */
    @PostMapping("/notes/{id}/mindmap")
    public ResponseEntity<ApiResponse<Map<String, String>>> startNoteMindmapJob(
            @PathVariable Long id,
            @RequestBody(required = false) AiConfigRequest config) {
        if (config == null) config = new AiConfigRequest();
        Long userId = securityUtil.getCurrentUserId();
        Note note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found: " + id));

        AsyncJob job = asyncJobService.createJob(userId, "MINDMAP");
        asyncJobService.processMindmapGeneration(job.getJobId(), SourceType.NOTE, note.getId(), note.getTitle(), note.getContent(), config);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok("Mindmap generation job started", Map.of("jobId", job.getJobId())));
    }

    /**
     * POST /api/jobs/notes/{id}/summarize — Khởi tạo Async Job tóm tắt Ghi chú
     */
    @PostMapping("/notes/{id}/summarize")
    public ResponseEntity<ApiResponse<Map<String, String>>> startNoteSummarizeJob(
            @PathVariable Long id,
            @RequestBody(required = false) AiConfigRequest config) {
        if (config == null) config = new AiConfigRequest();
        Long userId = securityUtil.getCurrentUserId();
        Note note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found: " + id));

        AsyncJob job = asyncJobService.createJob(userId, "SUMMARY");
        asyncJobService.processSummaryGeneration(job.getJobId(), SourceType.NOTE, note.getId(), note.getTitle(), note.getContent(), config);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok("Summary generation job started", Map.of("jobId", job.getJobId())));
    }

    // ── Document Async Triggers ────────────────────────────

    /**
     * POST /api/jobs/documents/{id}/quiz — Khởi tạo Async Job sinh Quiz từ Tài liệu
     */
    @PostMapping("/documents/{id}/quiz")
    public ResponseEntity<ApiResponse<Map<String, String>>> startDocQuizJob(
            @PathVariable Long id,
            @RequestBody(required = false) AiConfigRequest config) {
        if (config == null) config = new AiConfigRequest();
        Long userId = securityUtil.getCurrentUserId();
        Document doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));

        if (doc.getExtractedText() == null || doc.getExtractedText().isBlank()) {
            throw new BadRequestException("Document text is empty");
        }

        AsyncJob job = asyncJobService.createJob(userId, "QUIZ");
        asyncJobService.processQuizGeneration(job.getJobId(), SourceType.DOCUMENT, doc.getId(), doc.getFileName(), doc.getExtractedText(), config);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok("Quiz generation job started", Map.of("jobId", job.getJobId())));
    }

    /**
     * POST /api/jobs/documents/{id}/mindmap — Khởi tạo Async Job sinh Mindmap từ Tài liệu
     */
    @PostMapping("/documents/{id}/mindmap")
    public ResponseEntity<ApiResponse<Map<String, String>>> startDocMindmapJob(
            @PathVariable Long id,
            @RequestBody(required = false) AiConfigRequest config) {
        if (config == null) config = new AiConfigRequest();
        Long userId = securityUtil.getCurrentUserId();
        Document doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));

        if (doc.getExtractedText() == null || doc.getExtractedText().isBlank()) {
            throw new BadRequestException("Document text is empty");
        }

        AsyncJob job = asyncJobService.createJob(userId, "MINDMAP");
        asyncJobService.processMindmapGeneration(job.getJobId(), SourceType.DOCUMENT, doc.getId(), doc.getFileName(), doc.getExtractedText(), config);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok("Mindmap generation job started", Map.of("jobId", job.getJobId())));
    }

    /**
     * POST /api/jobs/documents/{id}/summarize — Khởi tạo Async Job tóm tắt Tài liệu
     */
    @PostMapping("/documents/{id}/summarize")
    public ResponseEntity<ApiResponse<Map<String, String>>> startDocSummarizeJob(
            @PathVariable Long id,
            @RequestBody(required = false) AiConfigRequest config) {
        if (config == null) config = new AiConfigRequest();
        Long userId = securityUtil.getCurrentUserId();
        Document doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));

        if (doc.getExtractedText() == null || doc.getExtractedText().isBlank()) {
            throw new BadRequestException("Document text is empty");
        }

        AsyncJob job = asyncJobService.createJob(userId, "SUMMARY");
        asyncJobService.processSummaryGeneration(job.getJobId(), SourceType.DOCUMENT, doc.getId(), doc.getFileName(), doc.getExtractedText(), config);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok("Summary generation job started", Map.of("jobId", job.getJobId())));
    }
}
