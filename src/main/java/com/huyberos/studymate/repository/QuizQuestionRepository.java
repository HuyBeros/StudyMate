package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    List<QuizQuestion> findByQuizId(Long quizId);

    void deleteByQuizId(Long quizId);
}
