package com.huyberos.studymate.dto.request;

import com.huyberos.studymate.entity.enums.DayOfWeek;
import com.huyberos.studymate.entity.enums.ShiftType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ScheduleSlotRequest {

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    @NotNull(message = "Day of week is required")
    private DayOfWeek dayOfWeek;

    private LocalDate date;

    @NotNull(message = "Shift type is required")
    private ShiftType shift;

    private String periods;
    private LocalTime startTime;
    private LocalTime endTime;

    private Boolean isOnline = false;
    private Boolean isRecurring = true;

    private String teacherName;
    private String teacherPhone;
    private String department;
    private String room;
}
