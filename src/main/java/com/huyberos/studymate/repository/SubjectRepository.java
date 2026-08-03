package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.enums.SubjectType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {

    List<Subject> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Subject> findByUserIdAndType(Long userId, SubjectType type);

    Optional<Subject> findByIdAndUserId(Long id, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);
}
