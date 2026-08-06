package com.huyberos.studymate.dto.request;

import com.huyberos.studymate.entity.enums.DayOfWeek;
import com.huyberos.studymate.entity.enums.ShiftType;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class ImportConfirmRequest {

    private List<ImportedSlotDto> slots;

    @Data
    public static class ImportedSlotDto {
        private String subjectName;
        private String classCode;
        private Long matchedSubjectId;
        private DayOfWeek dayOfWeek;
        private LocalDate date;
        private ShiftType shift;
        private String periods;
        private LocalTime startTime;
        private LocalTime endTime;
        private String room;
        private String teacherName;
        private Boolean isOnline;
        private Boolean isRecurring;
    }
}
