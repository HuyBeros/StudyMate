package com.huyberos.studymate.entity;

import com.huyberos.studymate.entity.enums.CorrectOption;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quiz_question")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "quiz_question_seq")
    @SequenceGenerator(name = "quiz_question_seq", sequenceName = "quiz_question_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(name = "question_text", nullable = false, columnDefinition = "text")
    private String questionText;

    @Column(name = "option_a", nullable = false, length = 500)
    private String optionA;

    @Column(name = "option_b", nullable = false, length = 500)
    private String optionB;

    @Column(name = "option_c", nullable = false, length = 500)
    private String optionC;

    @Column(name = "option_d", nullable = false, length = 500)
    private String optionD;

    @Enumerated(EnumType.STRING)
    @Column(name = "correct_option", nullable = false, columnDefinition = "correct_option")
    private CorrectOption correctOption;

    @Column(name = "explanation", columnDefinition = "text")
    private String explanation;
}
