package com.huyberos.studymate.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TodayDashboardResponse {

    private List<ScheduleSlotResponse> todaySlots;
    private List<TaskResponse> todayTasks;
    private int totalPendingTasks;
    private int overdueTasks;
}
