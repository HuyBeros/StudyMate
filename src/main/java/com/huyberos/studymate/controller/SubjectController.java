package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.request.SubjectRequest;
import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.dto.response.SubjectResponse;
import com.huyberos.studymate.entity.enums.SubjectType;
import com.huyberos.studymate.service.SubjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    /**
     * GET /api/subjects
     * Query param: ?type=SCHOOL | SELF_STUDY | LANGUAGE (optional)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> getAllSubjects(
            @RequestParam(required = false) SubjectType type) {
        List<SubjectResponse> subjects = subjectService.getAllSubjects(type);
        return ResponseEntity.ok(ApiResponse.ok(subjects));
    }

    /**
     * GET /api/subjects/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubjectResponse>> getSubjectById(@PathVariable Long id) {
        SubjectResponse subject = subjectService.getSubjectById(id);
        return ResponseEntity.ok(ApiResponse.ok(subject));
    }

    /**
     * POST /api/subjects
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SubjectResponse>> createSubject(
            @Valid @RequestBody SubjectRequest request) {
        SubjectResponse created = subjectService.createSubject(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Subject created successfully", created));
    }

    /**
     * PUT /api/subjects/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SubjectResponse>> updateSubject(
            @PathVariable Long id,
            @Valid @RequestBody SubjectRequest request) {
        SubjectResponse updated = subjectService.updateSubject(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Subject updated successfully", updated));
    }

    /**
     * DELETE /api/subjects/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSubject(@PathVariable Long id) {
        subjectService.deleteSubject(id);
        return ResponseEntity.ok(ApiResponse.ok("Subject deleted successfully", null));
    }
}
