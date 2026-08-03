package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.Note;
import com.huyberos.studymate.entity.enums.ImportanceLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findBySubjectIdOrderByUpdatedAtDesc(Long subjectId);

    List<Note> findBySubjectIdAndImportanceLevel(Long subjectId, ImportanceLevel level);

    // Tìm note theo id và xác nhận thuộc về user (bảo mật)
    @Query("SELECT n FROM Note n WHERE n.id = :id AND n.subject.user.id = :userId")
    Optional<Note> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    // Tất cả note của user (dùng cho search tổng)
    @Query("SELECT n FROM Note n WHERE n.subject.user.id = :userId ORDER BY n.updatedAt DESC")
    List<Note> findAllByUserId(@Param("userId") Long userId);

    // Full-text search đơn giản theo title/content
    @Query("SELECT n FROM Note n WHERE n.subject.user.id = :userId AND (LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(n.content) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Note> searchByKeyword(@Param("userId") Long userId, @Param("keyword") String keyword);
}
