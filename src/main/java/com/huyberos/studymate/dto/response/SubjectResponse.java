package com.huyberos.studymate.dto.response;

import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.enums.SubjectType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SubjectResponse {

    private Long id;
    private String name;
    private String color;
    private SubjectType type;
    private String classCode;
    private LocalDateTime createdAt;

    private int totalTasks;
    private int totalNotes;
    private int totalDocuments;
    private int totalScheduleSlots;

    public static SubjectResponse fromEntity(Subject subject) {
        return SubjectResponse.builder()
                .id(subject.getId())
                .name(subject.getName())
                .color(subject.getColor())
                .type(subject.getType())
                .classCode(subject.getClassCode())
                .createdAt(subject.getCreatedAt())
                .totalTasks(subject.getTasks() != null ? subject.getTasks().size() : 0)
                .totalNotes(subject.getNotes() != null ? subject.getNotes().size() : 0)
                .totalDocuments(subject.getDocuments() != null ? subject.getDocuments().size() : 0)
                .totalScheduleSlots(subject.getScheduleSlots() != null ? subject.getScheduleSlots().size() : 0)
                .build();
    }
}
