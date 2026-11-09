package com.huyberos.studymate.study;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudyPreferencesRepository extends JpaRepository<StudyPreferences, Long> {
    Optional<StudyPreferences> findByUserId(Long userId);
}
