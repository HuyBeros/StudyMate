package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.dto.response.TodayDashboardResponse;
import com.huyberos.studymate.dto.response.WeekDashboardResponse;
import com.huyberos.studymate.dto.response.WeeklyStatsResponse;
import com.huyberos.studymate.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /**
     * GET /api/dashboard/today — Lịch học + Task cần làm hôm nay
     */
    @GetMapping("/dashboard/today")
    public ResponseEntity<ApiResponse<TodayDashboardResponse>> getTodayDashboard() {
        TodayDashboardResponse data = dashboardService.getTodayDashboard();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    /**
     * GET /api/dashboard/week — Lịch & Task trong 7 ngày tới
     */
    @GetMapping("/dashboard/week")
    public ResponseEntity<ApiResponse<WeekDashboardResponse>> getWeekDashboard() {
        WeekDashboardResponse data = dashboardService.getWeekDashboard();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    /**
     * GET /api/stats/weekly — Thống kê tiến độ theo môn & kết quả học tập
     */
    @GetMapping("/stats/weekly")
    public ResponseEntity<ApiResponse<WeeklyStatsResponse>> getWeeklyStats() {
        WeeklyStatsResponse data = dashboardService.getWeeklyStats();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
