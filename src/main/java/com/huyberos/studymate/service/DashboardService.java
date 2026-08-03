package com.huyberos.studymate.service;

import com.huyberos.studymate.dto.response.*;
import com.huyberos.studymate.entity.QuizAttempt;
import com.huyberos.studymate.entity.ScheduleSlot;
import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.Task;
import com.huyberos.studymate.entity.enums.DayOfWeek;
import com.huyberos.studymate.entity.enums.TaskStatus;
import com.huyberos.studymate.repository.*;
import com.huyberos.studymate.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ScheduleSlotRepository scheduleSlotRepository;
    private final TaskRepository taskRepository;
    private final SubjectRepository subjectRepository;
    private final NoteRepository noteRepository;
    private final DocumentRepository documentRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final SecurityUtil securityUtil;

    @Transactional(readOnly = true)
    public TodayDashboardResponse getTodayDashboard() {
        Long userId = securityUtil.getCurrentUserId();
        LocalDate today = LocalDate.now();
        DayOfWeek dayOfWeek = ScheduleSlotService.mapJavaDayOfWeekToEnum(today.getDayOfWeek());

        // 1. Slots hôm nay
        List<ScheduleSlotResponse> todaySlots = scheduleSlotRepository
                .findTodaySlots(userId, dayOfWeek, today)
                .stream()
                .map(ScheduleSlotResponse::fromEntity)
                .toList();

        // 2. Tasks hôm nay
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(23, 59, 59);
        List<Task> todayTaskList = taskRepository.findTodayPendingTasks(userId, startOfDay, endOfDay);

        List<TaskResponse> todayTasks = todayTaskList.stream()
                .map(TaskResponse::fromEntity)
                .toList();

        // 3. Tất cả pending & overdue tasks
        List<Task> allUserTasks = taskRepository.findAllByUserId(userId);
        int totalPending = (int) allUserTasks.stream().filter(t -> t.getStatus() != TaskStatus.DONE).count();
        int totalOverdue = (int) allUserTasks.stream()
                .filter(t -> t.getDeadline() != null && t.getDeadline().isBefore(LocalDateTime.now()) && t.getStatus() != TaskStatus.DONE)
                .count();

        return TodayDashboardResponse.builder()
                .todaySlots(todaySlots)
                .todayTasks(todayTasks)
                .totalPendingTasks(totalPending)
                .overdueTasks(totalOverdue)
                .build();
    }

    @Transactional(readOnly = true)
    public WeekDashboardResponse getWeekDashboard() {
        Long userId = securityUtil.getCurrentUserId();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next7Days = now.plusDays(7);

        // 1. Tasks trong 7 ngày tới
        List<TaskResponse> upcomingTasks = taskRepository
                .findByUserIdAndDeadlineBetween(userId, now, next7Days)
                .stream()
                .map(TaskResponse::fromEntity)
                .toList();

        // 2. Tất cả slots tuần này
        List<ScheduleSlotResponse> weekSlots = scheduleSlotRepository
                .findAllByUserId(userId)
                .stream()
                .map(ScheduleSlotResponse::fromEntity)
                .toList();

        return WeekDashboardResponse.builder()
                .upcomingTasks7Days(upcomingTasks)
                .weekSlots(weekSlots)
                .build();
    }

    @Transactional(readOnly = true)
    public WeeklyStatsResponse getWeeklyStats() {
        Long userId = securityUtil.getCurrentUserId();

        List<Task> allTasks = taskRepository.findAllByUserId(userId);
        int completed = (int) allTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        int pending = (int) allTasks.stream().filter(t -> t.getStatus() != TaskStatus.DONE).count();

        int noteCount = noteRepository.findAllByUserId(userId).size();

        List<Subject> subjects = subjectRepository.findByUserIdOrderByCreatedAtDesc(userId);
        int docCount = subjects.stream()
                .mapToInt(s -> documentRepository.findBySubjectIdOrderByUploadDateDesc(s.getId()).size())
                .sum();

        // Thống kê task theo từng môn
        List<Object[]> rawCounts = taskRepository.countBySubjectAndStatus(userId);
        // Map<SubjectId, Map<TaskStatus, Count>>
        Map<Long, Map<TaskStatus, Long>> subjectStatusMap = rawCounts.stream().collect(
                Collectors.groupingBy(
                        row -> (Long) row[0],
                        Collectors.toMap(
                                row -> (TaskStatus) row[1],
                                row -> (Long) row[2]
                        )
                )
        );

        List<WeeklyStatsResponse.SubjectTaskStat> subjectStats = new ArrayList<>();
        for (Subject s : subjects) {
            Map<TaskStatus, Long> counts = subjectStatusMap.getOrDefault(s.getId(), Map.of());
            subjectStats.add(WeeklyStatsResponse.SubjectTaskStat.builder()
                    .subjectId(s.getId())
                    .subjectName(s.getName())
                    .color(s.getColor())
                    .todoCount(counts.getOrDefault(TaskStatus.TODO, 0L))
                    .doingCount(counts.getOrDefault(TaskStatus.DOING, 0L))
                    .doneCount(counts.getOrDefault(TaskStatus.DONE, 0L))
                    .build());
        }

        // Tính điểm trung bình quiz
        List<QuizAttempt> attempts = quizAttemptRepository.findByUserIdOrderByAttemptedAtDesc(userId);
        Double avgScore = null;
        if (!attempts.isEmpty()) {
            double totalPct = attempts.stream()
                    .mapToDouble(a -> a.getTotalQuestions() > 0 ? ((double) a.getScore() / a.getTotalQuestions() * 100.0) : 0.0)
                    .average()
                    .orElse(0.0);
            avgScore = Math.round(totalPct * 10.0) / 10.0;
        }

        return WeeklyStatsResponse.builder()
                .totalTasksCompleted(completed)
                .totalTasksPending(pending)
                .totalNotesCreated(noteCount)
                .totalDocumentsUploaded(docCount)
                .averageQuizScore(avgScore)
                .subjectTaskStats(subjectStats)
                .build();
    }
}
