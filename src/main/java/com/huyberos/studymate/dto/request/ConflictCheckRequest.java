package com.huyberos.studymate.dto.request;

import com.huyberos.studymate.entity.enums.DayOfWeek;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ConflictCheckRequest {
    private Long id;
    private DayOfWeek dayOfWeek;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private Boolean isRecurring;
}
