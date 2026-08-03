package com.huyberos.studymate.dto.response;

import com.huyberos.studymate.entity.Quiz;
import com.huyberos.studymate.entity.enums.SourceType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class QuizResponse {

    private Long id;
    private SourceType sourceType;
    private Long sourceId;
    private String title;
    private LocalDateTime createdAt;
    private int totalQuestions;
    private List<QuizQuestionResponse> questions;

    public static QuizResponse fromEntity(Quiz quiz, boolean includeAnswers) {
        List<QuizQuestionResponse> questionDtos = quiz.getQuestions() != null
                ? quiz.getQuestions().stream().map(q -> QuizQuestionResponse.fromEntity(q, includeAnswers)).toList()
                : List.of();

        return QuizResponse.builder()
                .id(quiz.getId())
                .sourceType(quiz.getSourceType())
                .sourceId(quiz.getSourceId())
                .title(quiz.getTitle())
                .createdAt(quiz.getCreatedAt())
                .totalQuestions(questionDtos.size())
                .questions(questionDtos)
                .build();
    }
}
