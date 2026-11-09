package com.huyberos.studymate.study;

import com.huyberos.studymate.entity.Task;
import com.huyberos.studymate.entity.enums.TaskStatus;
import com.huyberos.studymate.exception.BadRequestException;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.SubjectRepository;
import com.huyberos.studymate.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class StudyOverviewService {
    private final StudyAccountCoordinator accounts;
    private final StudySessionRepository sessions;
    private final TaskCompletionEventRepository events;
    private final TaskRepository tasks;
    private final SubjectRepository subjects;
    private final Clock clock;

    public record Overview(StudyDtos.Preferences preferences, StudyDtos.Metrics metrics, StudyDtos.Session activeSession) { }

    @Transactional
    public Overview overview(LocalDate from, LocalDate to, Long subjectId) {
        // Uses the same account lock as task/session/preferences writers, including initialization.
        var user = accounts.lockCurrent(); var pref = accounts.preferences(user);
        ZoneId zone = ZoneId.of(pref.getTimezone()); var now = clock.instant(); LocalDate today = now.atZone(zone).toLocalDate();
        var weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        if (from == null) from = weekStart; if (to == null) to = today;
        if (from.isAfter(to) || to.isAfter(today) || ChronoUnit.DAYS.between(from, to) > 365)
            throw new BadRequestException("Chọn khoảng thời gian hợp lệ, tối đa 366 ngày và không trong tương lai.");
        if (subjectId != null) subjects.findByIdAndUserId(subjectId, user.getId()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy môn học."));
        var allTasks = tasks.findAllByUserId(user.getId()); var allEvents = events.findByUserId(user.getId());
        var allSessions = sessions.findWithSegmentsByUserIdOrderByIdDesc(user.getId());
        var engine = new StudyMetricsCalculator();
        var snapshot = calculate(engine, allTasks, allEvents, allSessions, zone, now);
        var todayTasks = allTasks.stream().filter(task -> task.getDueAt() != null ? task.getDueAt().toLocalDate().equals(today)
                : task.getStatus() != TaskStatus.DONE || task.getCompletedAt() != null && task.getCompletedAt().atZone(accounts.legacyZone()).withZoneSameInstant(zone).toLocalDate().equals(today)).toList();
        var subjectTasks = allTasks;
        var selected = snapshot;
        if (subjectId != null) {
            subjectTasks = allTasks.stream().filter(task -> task.getSubject() != null && subjectId.equals(task.getSubject().getId())).toList();
            var selectedSessions = allSessions.stream().filter(session -> subjectId.equals(session.getSubjectId())).toList();
            var selectedEvents = allEvents.stream().filter(event -> subjectId.equals(event.getSubjectId())).toList();
            selected = calculate(engine, subjectTasks, selectedEvents, selectedSessions, zone, now);
        }
        final LocalDate first = from, last = to;
        var periodTasks = subjectTasks.stream().filter(task -> {
            var date = task.getCreatedAtInstant().atZone(zone).toLocalDate();
            return !date.isBefore(first) && !date.isAfter(last);
        }).toList();
        var days = selected.days().stream().filter(day -> !day.date().isBefore(first) && !day.date().isAfter(last)).toList();
        var subjectProgress = subjects.findByUserIdOrderByCreatedAtDesc(user.getId()).stream().filter(subject -> subjectId == null || subjectId.equals(subject.getId()))
                .map(subject -> { var p = progress(periodTasks.stream().filter(task -> task.getSubject() != null && subject.getId().equals(task.getSubject().getId())).toList());
                    return new StudyDtos.SubjectProgress(subject.getId(), subject.getName(), p.totalTasks(), p.completedTasks(), p.progressPercent()); }).toList();
        Map<String, Long> statusCounts = java.util.Arrays.stream(TaskStatus.values()).collect(Collectors.toMap(Enum::name,
                status -> periodTasks.stream().filter(task -> task.getStatus() == status).count()));
        var period = new StudyDtos.Period(first, last, subjectId, days.stream().mapToLong(StudyMetricsCalculator.DayActivity::focusSeconds).sum(),
                selected.weekFocusSeconds(), previousWeek(selected.days(), weekStart), progress(periodTasks), statusCounts, subjectProgress, days);
        long legacySeconds = allSessions.stream().filter(session -> session.getProvenance() == StudyProvenance.LEGACY_DURATION && !session.getEndedAt().isAfter(now))
                .mapToLong(StudySession::getLegacyDurationSeconds).sum();
        var metrics = new StudyDtos.Metrics(snapshot.metricsVersion(), pref.getTimezone(), now, accounts.state(user).getRevision(),
                snapshot.streak(), snapshot.totalFocusSeconds(), snapshot.weekFocusSeconds(), previousWeek(snapshot.days(), weekStart), legacySeconds,
                progress(allTasks), progress(todayTasks), snapshot.days(), period);
        var active = allSessions.stream().filter(session -> session.getStatus() == StudySessionStatus.RUNNING || session.getStatus() == StudySessionStatus.PAUSED)
                .findFirst().map(session -> StudySessionService.response(session, now)).orElse(null);
        return new Overview(StudyPreferencesService.response(pref), metrics, active);
    }

    private StudyMetricsCalculator.Snapshot calculate(StudyMetricsCalculator engine, List<Task> tasks,
            List<TaskCompletionEvent> events, List<StudySession> sessions, ZoneId zone, java.time.Instant now) {
        var taskStates = tasks.stream().map(task -> new StudyMetricsCalculator.TaskState(task.getPublicId().toString(), task.getStatus().name(), task.isDeleted())).toList();
        var completions = events.stream().map(event -> new StudyMetricsCalculator.Completion(event.getPublicId().toString(), event.getTaskPublicId().toString(), event.getCompletedAt(), event.getRevokedAt() != null)).toList();
        var tracked = sessions.stream().filter(session -> session.getProvenance() == StudyProvenance.TRACKED)
                .map(session -> new StudyMetricsCalculator.Session(session.getPublicId().toString(), session.getStatus().name(), session.getSegments().stream()
                        .filter(segment -> segment.getEndedAt() != null && segment.getEndedAt().isAfter(segment.getStartedAt()))
                        .map(segment -> new StudyMetricsCalculator.Interval(segment.getStartedAt(), segment.getEndedAt())).toList())).toList();
        var legacy = sessions.stream().filter(session -> session.getProvenance() == StudyProvenance.LEGACY_DURATION && session.getStatus() == StudySessionStatus.COMPLETED)
                .map(session -> new StudyMetricsCalculator.LegacyDuration(session.getPublicId().toString(), session.getEndedAt(), session.getLegacyDurationSeconds())).toList();
        return engine.calculate(taskStates, completions, tracked, legacy, zone, now);
    }

    private static StudyDtos.Progress progress(List<Task> tasks) {
        int done = (int) tasks.stream().filter(task -> task.getStatus() == TaskStatus.DONE).count();
        return new StudyDtos.Progress(tasks.size(), done, tasks.isEmpty() ? null : (int) Math.round(done * 100.0 / tasks.size()));
    }
    private static long previousWeek(List<StudyMetricsCalculator.DayActivity> days, LocalDate weekStart) {
        return days.stream().filter(day -> !day.date().isBefore(weekStart.minusDays(7)) && day.date().isBefore(weekStart)).mapToLong(StudyMetricsCalculator.DayActivity::focusSeconds).sum();
    }
}
