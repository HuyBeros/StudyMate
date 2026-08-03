package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.request.TaskRequest;
import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.dto.response.TaskResponse;
import com.huyberos.studymate.entity.enums.TaskStatus;
import com.huyberos.studymate.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    /**
     * GET /api/tasks
     * Filters: ?status=TODO|DOING|DONE & ?subjectId=1
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getAllTasks(
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) Long subjectId) {
        List<TaskResponse> tasks = taskService.getAllTasks(status, subjectId);
        return ResponseEntity.ok(ApiResponse.ok(tasks));
    }

    /**
     * GET /api/tasks/today — Tasks deadline hôm nay
     */
    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTodayPendingTasks() {
        List<TaskResponse> tasks = taskService.getTodayPendingTasks();
        return ResponseEntity.ok(ApiResponse.ok(tasks));
    }

    /**
     * GET /api/tasks/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTaskById(@PathVariable Long id) {
        TaskResponse task = taskService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.ok(task));
    }

    /**
     * POST /api/tasks
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @Valid @RequestBody TaskRequest request) {
        TaskResponse created = taskService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Task created successfully", created));
    }

    /**
     * PUT /api/tasks/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskRequest request) {
        TaskResponse updated = taskService.updateTask(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Task updated successfully", updated));
    }

    /**
     * PATCH /api/tasks/{id}/status — Nhanh chuyển trạng thái (VD: TODO -> DONE)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
            @PathVariable Long id,
            @RequestParam TaskStatus status) {
        TaskResponse updated = taskService.updateTaskStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Task status updated", updated));
    }

    /**
     * DELETE /api/tasks/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.ok("Task deleted successfully", null));
    }
}
