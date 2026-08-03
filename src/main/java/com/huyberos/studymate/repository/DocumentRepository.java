package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.Document;
import com.huyberos.studymate.entity.enums.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findBySubjectIdOrderByUploadDateDesc(Long subjectId);

    List<Document> findBySubjectIdAndStatus(Long subjectId, DocumentStatus status);

    // Xác nhận document thuộc về user
    @Query("SELECT d FROM Document d WHERE d.id = :id AND d.subject.user.id = :userId")
    Optional<Document> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    // Lấy extractedText để gửi cho AI (chỉ fetch field cần thiết)
    @Query("SELECT d.extractedText FROM Document d WHERE d.id = :id")
    Optional<String> findExtractedTextById(@Param("id") Long id);
}
