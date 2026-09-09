package com.huyberos.studymate.dto.response;

import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.enums.SubjectType;
import com.huyberos.studymate.entity.enums.TaskStatus;
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
    private int completedTasks;
    private int progressPercent;
    private int totalNotes;
    private int totalDocuments;
    private int totalScheduleSlots;

    public static SubjectResponse fromEntity(Subject subject) {
        int total = subject.getTasks() != null ? subject.getTasks().size() : 0;
        int completed = subject.getTasks() != null
                ? (int) subject.getTasks().stream()
                        .filter(t -> t.getStatus() == TaskStatus.DONE)
                        .count()
                : 0;
        int progress = total > 0 ? (int) Math.round((double) completed * 100 / total) : 0;

        return SubjectResponse.builder()
                .id(subject.getId())
                .name(subject.getName())
                .color(subject.getColor())
                .type(subject.getType())
                .classCode(subject.getClassCode())
                .createdAt(subject.getCreatedAt())
                .totalTasks(total)
                .completedTasks(completed)
                .progressPercent(progress)
                .totalNotes(subject.getNotes() != null ? subject.getNotes().size() : 0)
                .totalDocuments(subject.getDocuments() != null ? subject.getDocuments().size() : 0)
                .totalScheduleSlots(subject.getScheduleSlots() != null ? subject.getScheduleSlots().size() : 0)
                .build();
    }
}
