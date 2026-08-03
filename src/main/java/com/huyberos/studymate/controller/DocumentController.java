package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.dto.response.DocumentResponse;
import com.huyberos.studymate.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    /**
     * GET /api/subjects/{subjectId}/documents — Lấy danh sách tài liệu theo môn
     */
    @GetMapping("/subjects/{subjectId}/documents")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getDocumentsBySubject(
            @PathVariable Long subjectId) {
        List<DocumentResponse> documents = documentService.getDocumentsBySubject(subjectId);
        return ResponseEntity.ok(ApiResponse.ok(documents));
    }

    /**
     * GET /api/documents/{id} — Lấy chi tiết tài liệu (kèm trích xuất text)
     */
    @GetMapping("/documents/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> getDocumentById(
            @PathVariable Long id) {
        DocumentResponse document = documentService.getDocumentById(id);
        return ResponseEntity.ok(ApiResponse.ok(document));
    }

    /**
     * POST /api/subjects/{subjectId}/documents/upload — Upload tài liệu (PDF, DOCX, PPTX)
     */
    @PostMapping(value = "/subjects/{subjectId}/documents/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadDocument(
            @PathVariable Long subjectId,
            @RequestParam(value = "scheduleSlotId", required = false) Long scheduleSlotId,
            @RequestParam("file") MultipartFile file) {
        DocumentResponse response = documentService.uploadDocument(subjectId, scheduleSlotId, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Document uploaded and text extracted", response));
    }

    /**
     * DELETE /api/documents/{id} — Xóa tài liệu
     */
    @DeleteMapping("/documents/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok(ApiResponse.ok("Document deleted successfully", null));
    }
}
