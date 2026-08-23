package com.huyberos.studymate.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class MemoRequest {

    @NotBlank(message = "Nội dung ghi chú không được để trống")
    private String content;

    private Long taskId;
    private Long subjectId;
    private LocalDate date;
}
