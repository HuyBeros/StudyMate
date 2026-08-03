package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByUserIdOrderByAttemptedAtDesc(Long userId);

    List<QuizAttempt> findByQuizIdAndUserId(Long quizId, Long userId);

    // Lần làm bài gần nhất của user với quiz đó
    @Query("SELECT a FROM QuizAttempt a WHERE a.quiz.id = :quizId AND a.user.id = :userId ORDER BY a.attemptedAt DESC LIMIT 1")
    java.util.Optional<QuizAttempt> findLatestByQuizIdAndUserId(
            @Param("quizId") Long quizId,
            @Param("userId") Long userId
    );

    // Thống kê: điểm trung bình theo quiz
    @Query("SELECT AVG(CAST(a.score AS double) / a.totalQuestions * 100) FROM QuizAttempt a WHERE a.quiz.id = :quizId")
    Double findAverageScoreByQuizId(@Param("quizId") Long quizId);
}
