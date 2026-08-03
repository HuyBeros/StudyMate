package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.Quiz;
import com.huyberos.studymate.entity.enums.SourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    // Quiz được tạo từ một Note hoặc Document cụ thể
    List<Quiz> findBySourceTypeAndSourceId(SourceType sourceType, Long sourceId);

    // Tất cả quiz của user (JOIN ngược qua source)
    @Query("""
            SELECT q FROM Quiz q
            WHERE (q.sourceType = 'NOTE'
                   AND EXISTS (SELECT 1 FROM Note n WHERE n.id = q.sourceId AND n.subject.user.id = :userId))
               OR (q.sourceType = 'DOCUMENT'
                   AND EXISTS (SELECT 1 FROM Document d WHERE d.id = q.sourceId AND d.subject.user.id = :userId))
            ORDER BY q.createdAt DESC
            """)
    List<Quiz> findAllByUserId(@Param("userId") Long userId);

    // Lấy quiz kèm questions (tránh N+1)
    @Query("SELECT q FROM Quiz q LEFT JOIN FETCH q.questions WHERE q.id = :id")
    Optional<Quiz> findByIdWithQuestions(@Param("id") Long id);
}
