package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.request.MindmapSaveRequest;
import com.huyberos.studymate.dto.request.QuizSaveRequest;
import com.huyberos.studymate.dto.request.SummarySaveRequest;
import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.dto.response.MindmapResponse;
import com.huyberos.studymate.dto.response.QuizResponse;
import com.huyberos.studymate.entity.Summary;
import com.huyberos.studymate.service.AiOutputService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai-outputs")
@RequiredArgsConstructor
public class AiOutputController {

    private final AiOutputService aiOutputService;

    @PostMapping("/quiz/save")
    public ResponseEntity<ApiResponse<QuizResponse>> saveQuiz(@RequestBody QuizSaveRequest request) {
        QuizResponse response = aiOutputService.saveQuiz(request);
        return ResponseEntity.ok(ApiResponse.ok("Quiz saved successfully", response));
    }

    @PostMapping("/mindmap/save")
    public ResponseEntity<ApiResponse<MindmapResponse>> saveMindmap(@RequestBody MindmapSaveRequest request) {
        MindmapResponse response = aiOutputService.saveMindmap(request);
        return ResponseEntity.ok(ApiResponse.ok("Mindmap saved successfully", response));
    }

    @PostMapping("/summary/save")
    public ResponseEntity<ApiResponse<Summary>> saveSummary(@RequestBody SummarySaveRequest request) {
        Summary response = aiOutputService.saveSummary(request);
        return ResponseEntity.ok(ApiResponse.ok("Summary saved successfully", response));
    }

    @GetMapping("/subjects/{subjectId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOutputsForSubject(@PathVariable Long subjectId) {
        Map<String, Object> outputs = aiOutputService.getAllAiOutputsForSubject(subjectId);
        return ResponseEntity.ok(ApiResponse.ok(outputs));
    }
}
