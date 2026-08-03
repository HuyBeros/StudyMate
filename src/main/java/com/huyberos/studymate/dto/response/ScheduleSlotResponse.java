package com.huyberos.studymate.dto.response;

import com.huyberos.studymate.entity.ScheduleSlot;
import com.huyberos.studymate.entity.enums.DayOfWeek;
import com.huyberos.studymate.entity.enums.ShiftType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
public class ScheduleSlotResponse {

    private Long id;
    private Long subjectId;
    private String subjectName;
    private String subjectColor;

    private DayOfWeek dayOfWeek;
    private LocalDate date;
    private ShiftType shift;
    private String periods;
    private LocalTime startTime;
    private LocalTime endTime;

    private Boolean isOnline;
    private Boolean isRecurring;

    private String teacherName;
    private String teacherPhone;
    private String department;
    private String room;

    public static ScheduleSlotResponse fromEntity(ScheduleSlot slot) {
        return ScheduleSlotResponse.builder()
                .id(slot.getId())
                .subjectId(slot.getSubject().getId())
                .subjectName(slot.getSubject().getName())
                .subjectColor(slot.getSubject().getColor())
                .dayOfWeek(slot.getDayOfWeek())
                .date(slot.getDate())
                .shift(slot.getShift())
                .periods(slot.getPeriods())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .isOnline(slot.getIsOnline())
                .isRecurring(slot.getIsRecurring())
                .teacherName(slot.getTeacherName())
                .teacherPhone(slot.getTeacherPhone())
                .department(slot.getDepartment())
                .room(slot.getRoom())
                .build();
    }
}
