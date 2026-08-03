package com.huyberos.studymate.dto.response;

import com.huyberos.studymate.entity.QuizQuestion;
import com.huyberos.studymate.entity.enums.CorrectOption;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class QuizQuestionResponse {

    private Long id;
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private CorrectOption correctOption;
    private String explanation;

    public static QuizQuestionResponse fromEntity(QuizQuestion q, boolean includeAnswers) {
        return QuizQuestionResponse.builder()
                .id(q.getId())
                .questionText(q.getQuestionText())
                .optionA(q.getOptionA())
                .optionB(q.getOptionB())
                .optionC(q.getOptionC())
                .optionD(q.getOptionD())
                .correctOption(includeAnswers ? q.getCorrectOption() : null)
                .explanation(includeAnswers ? q.getExplanation() : null)
                .build();
    }
}
