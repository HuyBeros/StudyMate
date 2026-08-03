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

    List<Task> findBySubjectId(Long subjectId);

    List<Task> findBySubjectIdAndStatus(Long subjectId, TaskStatus status);

    // Tất cả task của user
    @Query("SELECT t FROM Task t WHERE t.subject.user.id = :userId ORDER BY t.deadline ASC NULLS LAST")
    List<Task> findAllByUserId(@Param("userId") Long userId);

    // Task của user theo status
    @Query("SELECT t FROM Task t WHERE t.subject.user.id = :userId AND t.status = :status")
    List<Task> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") TaskStatus status);

    // Dashboard: task deadline trong khoảng thời gian
    @Query("SELECT t FROM Task t WHERE t.subject.user.id = :userId AND t.deadline BETWEEN :start AND :end ORDER BY t.deadline ASC")
    List<Task> findByUserIdAndDeadlineBetween(
            @Param("userId") Long userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // Dashboard: task deadline hôm nay (chưa DONE)
    @Query("""
            SELECT t FROM Task t
            WHERE t.subject.user.id = :userId
              AND t.deadline BETWEEN :startOfDay AND :endOfDay
              AND t.status <> 'DONE'
            ORDER BY t.deadline ASC
            """)
    List<Task> findTodayPendingTasks(
            @Param("userId") Long userId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay
    );

    // Thống kê: đếm task theo status theo từng subject
    @Query("""
            SELECT t.subject.id, t.status, COUNT(t)
            FROM Task t
            WHERE t.subject.user.id = :userId
            GROUP BY t.subject.id, t.status
            """)
    List<Object[]> countBySubjectAndStatus(@Param("userId") Long userId);
}
