package com.huyberos.studymate.dto.response;

import com.huyberos.studymate.entity.QuizAttempt;
import com.huyberos.studymate.entity.enums.CorrectOption;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class QuizAttemptResponse {

    private Long id;
    private Long quizId;
    private String quizTitle;
    private int score;
    private int totalQuestions;
    private double percentage;
    private LocalDateTime attemptedAt;
    private List<QuestionResultDetail> details;

    @Data
    @Builder
    public static class QuestionResultDetail {
        private Long questionId;
        private String questionText;
        private CorrectOption userOption;
        private CorrectOption correctOption;
        private boolean isCorrect;
        private String explanation;
    }

    public static QuizAttemptResponse fromEntity(QuizAttempt attempt, List<QuestionResultDetail> details) {
        double percentage = attempt.getTotalQuestions() > 0
                ? Math.round((double) attempt.getScore() / attempt.getTotalQuestions() * 100.0 * 10.0) / 10.0
                : 0.0;

        return QuizAttemptResponse.builder()
                .id(attempt.getId())
                .quizId(attempt.getQuiz().getId())
                .quizTitle(attempt.getQuiz().getTitle())
                .score(attempt.getScore())
                .totalQuestions(attempt.getTotalQuestions())
                .percentage(percentage)
                .attemptedAt(attempt.getAttemptedAt())
                .details(details)
                .build();
    }
}
