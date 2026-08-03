package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.Mindmap;
import com.huyberos.studymate.entity.enums.SourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MindmapRepository extends JpaRepository<Mindmap, Long> {

    List<Mindmap> findBySourceTypeAndSourceId(SourceType sourceType, Long sourceId);

    // Lấy mindmap mới nhất của một source
    Optional<Mindmap> findTopBySourceTypeAndSourceIdOrderByCreatedAtDesc(SourceType sourceType, Long sourceId);
}
