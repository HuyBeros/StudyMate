package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.NoteImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteImageRepository extends JpaRepository<NoteImage, Long> {

    List<NoteImage> findByNoteIdOrderByPositionAsc(Long noteId);

    void deleteByNoteId(Long noteId);
}
