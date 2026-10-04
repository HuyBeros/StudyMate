package com.huyberos.studymate.dto.request;

import com.huyberos.studymate.entity.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TaskRequest {

    private Long subjectId;

    @NotBlank(message = "Task title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String description;
    private LocalDateTime dueAt;
    
    private com.huyberos.studymate.entity.enums.TaskPriority priority = com.huyberos.studymate.entity.enums.TaskPriority.MEDIUM;
    private TaskStatus status = TaskStatus.TODO;
}
