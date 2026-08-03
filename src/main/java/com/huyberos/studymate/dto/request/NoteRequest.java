package com.huyberos.studymate.dto.request;

import com.huyberos.studymate.entity.enums.ImportanceLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NoteRequest {

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    private Long scheduleSlotId;

    @NotBlank(message = "Note title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String content;
    private ImportanceLevel importanceLevel = ImportanceLevel.NORMAL;
}
