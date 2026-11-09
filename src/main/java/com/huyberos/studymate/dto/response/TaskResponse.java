package com.huyberos.studymate.dto.response;

import com.huyberos.studymate.entity.Task;
import com.huyberos.studymate.entity.enums.TaskStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TaskResponse {

    private Long id;
    private java.util.UUID publicId;
    private Long subjectId;
    private String subjectName;
    private String subjectColor;

    private String title;
    private String description;
    private LocalDateTime dueAt;
    private com.huyberos.studymate.entity.enums.TaskPriority priority;
    private TaskStatus status;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean deleted;
    private boolean isOverdue;

    public static TaskResponse fromEntity(Task task) {
        boolean overdue = task.getDueAt() != null
                && task.getDueAt().isBefore(LocalDateTime.now())
                && task.getStatus() != TaskStatus.DONE;

        return TaskResponse.builder()
                .id(task.getId())
                .publicId(task.getPublicId())
                .subjectId(task.getSubject() != null ? task.getSubject().getId() : null)
                .subjectName(task.getSubject() != null ? task.getSubject().getName() : null)
                .subjectColor(task.getSubject() != null ? task.getSubject().getColor() : null)
                .title(task.getTitle())
                .description(task.getDescription())
                .dueAt(task.getDueAt())
                .priority(task.getPriority())
                .status(task.getStatus())
                .completedAt(task.getCompletedAt())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .deleted(task.isDeleted())
                .isOverdue(overdue)
                .build();
    }
}
