package com.huyberos.studymate.dto.request;

import lombok.Data;

@Data
public class AiConfigRequest {
    private Integer numberOfQuestions = 5;
    private String difficulty = "Medium";
    private String focusAreas;
    private String language = "Vietnamese";
}
