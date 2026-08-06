package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.request.ConflictCheckRequest;
import com.huyberos.studymate.dto.request.ImportConfirmRequest;
import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.dto.response.ConflictCheckResponse;
import com.huyberos.studymate.dto.response.ScheduleImportPreviewResponse;
import com.huyberos.studymate.service.ScheduleImportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
public class ScheduleImportController {

    private final ScheduleImportService scheduleImportService;

    /**
     * POST /api/schedule/import/image — Nhận diện TKB bằng AI từ hình ảnh
     */
    @PostMapping("/import/image")
    public ResponseEntity<ApiResponse<List<ScheduleImportPreviewResponse>>> importImage(
            @RequestParam("file") MultipartFile file) {
        List<ScheduleImportPreviewResponse> preview = scheduleImportService.previewScheduleImage(file);
        return ResponseEntity.ok(ApiResponse.ok("Parsed timetable image successfully", preview));
    }

    /**
     * POST /api/schedule/import/confirm — Lưu danh sách TKB nháp đã được xác nhận
     */
    @PostMapping("/import/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmImport(
            @RequestBody @Valid ImportConfirmRequest request) {
        scheduleImportService.confirmImport(request);
        return ResponseEntity.ok(ApiResponse.ok("Timetable imported successfully", null));
    }

    /**
     * POST /api/schedule/check-conflict — Kiểm tra xung đột lịch học trực tiếp
     */
    @PostMapping("/check-conflict")
    public ResponseEntity<ApiResponse<ConflictCheckResponse>> checkConflict(
            @RequestBody @Valid ConflictCheckRequest request) {
        ConflictCheckResponse response = scheduleImportService.checkConflict(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
