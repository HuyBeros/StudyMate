package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.request.MemoRequest;
import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.dto.response.MemoResponse;
import com.huyberos.studymate.service.MemoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/memos")
@RequiredArgsConstructor
public class MemoController {

    private final MemoService memoService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MemoResponse>>> getMemos(
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) Long taskId,
            @RequestParam(required = false) Long subjectId) {
        List<MemoResponse> memos = memoService.getMemos(date, taskId, subjectId);
        return ResponseEntity.ok(ApiResponse.ok(memos));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MemoResponse>> createMemo(@Valid @RequestBody MemoRequest request) {
        MemoResponse created = memoService.createMemo(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Memo created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MemoResponse>> updateMemo(
            @PathVariable Long id,
            @Valid @RequestBody MemoRequest request) {
        MemoResponse updated = memoService.updateMemo(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Memo updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMemo(@PathVariable Long id) {
        memoService.deleteMemo(id);
        return ResponseEntity.ok(ApiResponse.ok("Memo deleted successfully", null));
    }
}
