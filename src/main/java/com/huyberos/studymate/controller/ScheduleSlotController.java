package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.request.ScheduleSlotRequest;
import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.dto.response.ScheduleSlotResponse;
import com.huyberos.studymate.entity.enums.DayOfWeek;
import com.huyberos.studymate.service.ScheduleSlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
public class ScheduleSlotController {

    private final ScheduleSlotService scheduleSlotService;

    /**
     * GET /api/schedule
     * Optional filter: ?day=THU_2 | ?subjectId=1
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ScheduleSlotResponse>>> getSchedule(
            @RequestParam(required = false) DayOfWeek day,
            @RequestParam(required = false) Long subjectId) {

        List<ScheduleSlotResponse> slots;
        if (subjectId != null) {
            slots = scheduleSlotService.getSlotsBySubject(subjectId);
        } else if (day != null) {
            slots = scheduleSlotService.getSlotsByDayOfWeek(day);
        } else {
            slots = scheduleSlotService.getAllSlots();
        }
        return ResponseEntity.ok(ApiResponse.ok(slots));
    }

    /**
     * GET /api/schedule/today — Lấy lịch học hôm nay
     */
    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<ScheduleSlotResponse>>> getTodaySchedule() {
        List<ScheduleSlotResponse> slots = scheduleSlotService.getTodaySlots();
        return ResponseEntity.ok(ApiResponse.ok(slots));
    }

    /**
     * POST /api/schedule/manual — Thêm 1 ô lịch học thủ công
     */
    @PostMapping("/manual")
    public ResponseEntity<ApiResponse<ScheduleSlotResponse>> createSlot(
            @Valid @RequestBody ScheduleSlotRequest request) {
        ScheduleSlotResponse created = scheduleSlotService.createSlot(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Schedule slot created", created));
    }

    /**
     * PUT /api/schedule/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ScheduleSlotResponse>> updateSlot(
            @PathVariable Long id,
            @Valid @RequestBody ScheduleSlotRequest request) {
        ScheduleSlotResponse updated = scheduleSlotService.updateSlot(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Schedule slot updated", updated));
    }

    /**
     * DELETE /api/schedule/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSlot(@PathVariable Long id) {
        scheduleSlotService.deleteSlot(id);
        return ResponseEntity.ok(ApiResponse.ok("Schedule slot deleted", null));
    }

    /**
     * GET /api/schedule/export/ics — Xuất TKB sang file iCalendar (.ics) cho Google / Apple Calendar
     */
    @GetMapping(value = "/export/ics", produces = "text/calendar;charset=UTF-8")
    public ResponseEntity<byte[]> exportIcs() {
        String icsContent = scheduleSlotService.exportCalendarIcs();
        byte[] bytes = icsContent.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"studymate-schedule.ics\"")
                .body(bytes);
    }
}
