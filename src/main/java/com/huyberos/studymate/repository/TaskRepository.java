package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.Task;
import com.huyberos.studymate.entity.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("SELECT t FROM Task t WHERE t.subject.id = :subjectId AND t.deleted = false")
    List<Task> findBySubjectId(@Param("subjectId") Long subjectId);

    @Query("SELECT t FROM Task t WHERE t.subject.id = :subjectId AND t.status = :status AND t.deleted = false")
    List<Task> findBySubjectIdAndStatus(@Param("subjectId") Long subjectId, @Param("status") TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.deleted = false ORDER BY t.dueAt ASC NULLS LAST")
    List<Task> findAllByUserId(@Param("userId") Long userId);

    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.status = :status AND t.deleted = false")
    List<Task> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.dueAt BETWEEN :start AND :end AND t.deleted = false ORDER BY t.dueAt ASC")
    List<Task> findByUserIdAndDeadlineBetween(
            @Param("userId") Long userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
            SELECT t FROM Task t
            WHERE t.user.id = :userId
              AND t.dueAt BETWEEN :startOfDay AND :endOfDay
              AND t.status <> 'DONE'
              AND t.deleted = false
            ORDER BY t.dueAt ASC
            """)
    List<Task> findTodayPendingTasks(
            @Param("userId") Long userId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay
    );

    @Query("""
            SELECT t.subject.id, t.status, COUNT(t)
            FROM Task t
            WHERE t.user.id = :userId AND t.deleted = false AND t.subject IS NOT NULL
            GROUP BY t.subject.id, t.status
            """)
    List<Object[]> countBySubjectAndStatus(@Param("userId") Long userId);
}
