package com.huyberos.studymate.dto.request;

import com.huyberos.studymate.entity.enums.CorrectOption;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class QuizAttemptRequest {

    /**
     * Map: questionId -> chosenOption ('A', 'B', 'C', 'D')
     */
    @NotNull(message = "Answers map is required")
    private Map<Long, CorrectOption> answers;
}
