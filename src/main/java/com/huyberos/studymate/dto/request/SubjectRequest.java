package com.huyberos.studymate.dto.request;

import com.huyberos.studymate.entity.enums.SubjectType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubjectRequest {

    @NotBlank(message = "Subject name is required")
    @Size(max = 255, message = "Name must not exceed 255 characters")
    private String name;

    @Size(max = 20, message = "Color must not exceed 20 characters")
    private String color = "#3B82F6";

    @NotNull(message = "Subject type is required")
    private SubjectType type = SubjectType.SCHOOL;

    @Size(max = 50, message = "Class code must not exceed 50 characters")
    private String classCode;
}
