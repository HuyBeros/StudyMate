package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.study.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.UUID;

@RestController @RequestMapping("/api/study") @RequiredArgsConstructor
public class StudyController {
    private final StudySessionService sessions;
    private final StudyPreferencesService preferences;
    private final StudyOverviewService overview;
    private final StudyLegacyImportService legacy;

    @GetMapping("/overview") public ApiResponse<StudyOverviewService.Overview> overview(
            @RequestParam(required=false) LocalDate from, @RequestParam(required=false) LocalDate to, @RequestParam(required=false) Long subjectId) {
        return ApiResponse.ok(overview.overview(from, to, subjectId));
    }
    @GetMapping("/metrics") public ApiResponse<StudyDtos.Metrics> metrics(
            @RequestParam(required=false) LocalDate from, @RequestParam(required=false) LocalDate to, @RequestParam(required=false) Long subjectId) {
        return ApiResponse.ok(overview.overview(from, to, subjectId).metrics());
    }
    @GetMapping("/preferences") public ApiResponse<StudyDtos.Preferences> preferences() { return ApiResponse.ok(preferences.get()); }
    @PutMapping("/preferences") public ApiResponse<StudyDtos.Preferences> save(@Valid @RequestBody StudyDtos.SavePreferences request) { return ApiResponse.ok(preferences.save(request)); }
    @PostMapping("/sessions") public ApiResponse<StudyDtos.Session> create(@RequestHeader("Idempotency-Key") UUID key, @Valid @RequestBody StudyDtos.CreateSession request) { return ApiResponse.ok(sessions.create(key, request)); }
    @PostMapping("/sessions/{id}/transitions") public ApiResponse<StudyDtos.Session> transition(@PathVariable UUID id,
            @RequestHeader("Idempotency-Key") UUID key, @Valid @RequestBody StudyDtos.Transition request) { return ApiResponse.ok(sessions.transition(id, key, request)); }
    @GetMapping("/sessions/active") public ApiResponse<StudyDtos.Session> active() { return ApiResponse.ok(sessions.active()); }
    @GetMapping("/sessions") public ApiResponse<StudyDtos.SessionPage> list(@RequestParam(required=false) LocalDate from,
            @RequestParam(required=false) LocalDate to, @RequestParam(required=false) Long subjectId,
            @RequestParam(defaultValue="0") int offset, @RequestParam(defaultValue="50") int limit) { return ApiResponse.ok(sessions.list(from, to, subjectId, offset, limit)); }
    @PostMapping("/import/legacy") public ApiResponse<StudyDtos.ImportResult> legacy(@RequestHeader("Idempotency-Key") UUID key,
            @Valid @RequestBody StudyDtos.ImportLegacy request) { return ApiResponse.ok(legacy.importLegacy(key, request)); }
}
