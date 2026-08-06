package com.huyberos.studymate.dto.response;

import com.huyberos.studymate.entity.enums.DayOfWeek;
import com.huyberos.studymate.entity.enums.ShiftType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class ScheduleImportPreviewResponse {

    private String subjectName;
    private String classCode;
    private DayOfWeek dayOfWeek;
    private LocalDate date;
    private ShiftType shift;
    private String periods;
    private LocalTime startTime;
    private LocalTime endTime;
    private String room;
    private String teacherName;

    // Mapping info
    private Long matchedSubjectId;
    private Boolean hasConflict;
    private String conflictMessage;
}
