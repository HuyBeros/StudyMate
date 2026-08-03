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
    private Long subjectId;
    private String subjectName;
    private String subjectColor;

    private String title;
    private String description;
    private LocalDateTime deadline;
    private TaskStatus status;
    private LocalDateTime createdAt;
    private boolean isOverdue;

    public static TaskResponse fromEntity(Task task) {
        boolean overdue = task.getDeadline() != null
                && task.getDeadline().isBefore(LocalDateTime.now())
                && task.getStatus() != TaskStatus.DONE;

        return TaskResponse.builder()
                .id(task.getId())
                .subjectId(task.getSubject().getId())
                .subjectName(task.getSubject().getName())
                .subjectColor(task.getSubject().getColor())
                .title(task.getTitle())
                .description(task.getDescription())
                .deadline(task.getDeadline())
                .status(task.getStatus())
                .createdAt(task.getCreatedAt())
                .isOverdue(overdue)
                .build();
    }
}
