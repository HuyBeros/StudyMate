package com.huyberos.studymate.study;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    Optional<StudySession> findByUserIdAndPublicId(Long userId, UUID publicId);
    List<StudySession> findByUserIdOrderByIdDesc(Long userId);

    @EntityGraph(attributePaths = "segments")
    List<StudySession> findWithSegmentsByUserIdOrderByIdDesc(Long userId);

    List<StudySession> findByUserIdAndStatusIn(Long userId, List<StudySessionStatus> statuses);
}
