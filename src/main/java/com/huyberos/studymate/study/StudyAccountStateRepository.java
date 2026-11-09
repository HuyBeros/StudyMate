package com.huyberos.studymate.study;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudyAccountStateRepository extends JpaRepository<StudyAccountState, Long> {
    Optional<StudyAccountState> findByUserId(Long userId);
}
