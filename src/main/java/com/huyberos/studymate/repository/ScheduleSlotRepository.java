package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.ScheduleSlot;
import com.huyberos.studymate.entity.enums.DayOfWeek;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleSlotRepository extends JpaRepository<ScheduleSlot, Long> {

    List<ScheduleSlot> findBySubjectId(Long subjectId);

    // Tất cả slot của user (JOIN qua subject)
    @Query("SELECT s FROM ScheduleSlot s WHERE s.subject.user.id = :userId ORDER BY s.dayOfWeek, s.startTime")
    List<ScheduleSlot> findAllByUserId(@Param("userId") Long userId);

    // Slot theo ngày trong tuần (lịch cố định hàng tuần)
    @Query("SELECT s FROM ScheduleSlot s WHERE s.subject.user.id = :userId AND s.dayOfWeek = :day")
    List<ScheduleSlot> findByUserIdAndDayOfWeek(@Param("userId") Long userId, @Param("day") DayOfWeek day);

    // Slot theo ngày cụ thể (lịch một lần)
    @Query("SELECT s FROM ScheduleSlot s WHERE s.subject.user.id = :userId AND s.date = :date")
    List<ScheduleSlot> findByUserIdAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    // Dashboard: hôm nay có slot nào (cả recurring + date cụ thể)
    @Query("""
            SELECT s FROM ScheduleSlot s
            WHERE s.subject.user.id = :userId
              AND (
                (s.isRecurring = true AND s.dayOfWeek = :dayOfWeek)
                OR (s.isRecurring = false AND s.date = :today)
              )
            ORDER BY s.startTime
            """)
    List<ScheduleSlot> findTodaySlots(
            @Param("userId") Long userId,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("today") LocalDate today
    );
}
