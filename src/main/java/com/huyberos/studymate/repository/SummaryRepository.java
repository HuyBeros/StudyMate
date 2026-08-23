package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.Summary;
import com.huyberos.studymate.entity.enums.SourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SummaryRepository extends JpaRepository<Summary, Long> {
    List<Summary> findBySourceTypeAndSourceId(SourceType sourceType, Long sourceId);
}
