package com.huyberos.studymate.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class WeekDashboardResponse {

    private List<TaskResponse> upcomingTasks7Days;
    private List<ScheduleSlotResponse> weekSlots;
}
