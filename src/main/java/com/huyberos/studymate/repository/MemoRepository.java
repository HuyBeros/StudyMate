package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.Memo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MemoRepository extends JpaRepository<Memo, Long> {

    List<Memo> findByUserIdAndDateOrderByCreatedAtDesc(Long userId, LocalDate date);

    List<Memo> findByUserIdAndTaskIdOrderByCreatedAtDesc(Long userId, Long taskId);
    
    List<Memo> findByUserIdAndSubjectIdOrderByCreatedAtDesc(Long userId, Long subjectId);
}
