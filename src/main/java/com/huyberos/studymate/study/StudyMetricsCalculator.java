package com.huyberos.studymate.study;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Canonical implementation of metrics V1. Inputs come from persisted P1 sessions/events.
 * No database or wall-clock dependency; also verified by the cross-platform contract fixtures.
 */
public final class StudyMetricsCalculator {
    public static final String VERSION = "study-metrics-v1";
    public static final long QUALIFYING_FOCUS_SECONDS = 600;

    public Snapshot calculate(List<TaskState> tasks, List<Completion> completions, List<Session> sessions,
                              ZoneId zone, Instant asOf) {
        return calculate(tasks, completions, sessions, List.of(), zone, asOf);
    }

    public Snapshot calculate(List<TaskState> tasks, List<Completion> completions, List<Session> sessions,
                              List<LegacyDuration> legacyDurations, ZoneId zone, Instant asOf) {
        Map<LocalDate, MutableDay> days = new TreeMap<>();
        List<Interval> intervals = new ArrayList<>();
        for (Session session : unique(sessions, Session::id)) {
            if (!List.of("COMPLETED", "STOPPED").contains(session.status())) continue;
            for (Interval interval : session.segments()) {
                if (!interval.end().isAfter(interval.start())) throw new IllegalArgumentException("Invalid focus interval");
                // Future/incomplete intervals are not confirmed study activity.
                if (interval.end().isAfter(asOf)) continue;
                intervals.add(interval);
            }
        }

        // Old records have an end timestamp + duration, never manufacture a start/interval.
        for (LegacyDuration legacy : unique(legacyDurations, LegacyDuration::id)) {
            if (legacy.seconds() <= 0) throw new IllegalArgumentException("Invalid legacy duration");
            if (legacy.at().isAfter(asOf)) continue;
            days.computeIfAbsent(legacy.at().atZone(zone).toLocalDate(), ignored -> new MutableDay()).focusSeconds += legacy.seconds();
        }

        // Union intervals across sessions: two devices never double the same wall-clock time.
        intervals.sort(Comparator.comparing(Interval::start));
        List<Interval> merged = new ArrayList<>();
        for (Interval interval : intervals) {
            if (merged.isEmpty() || interval.start().isAfter(merged.getLast().end())) merged.add(interval);
            else {
                Interval previous = merged.removeLast();
                merged.add(new Interval(previous.start(), interval.end().isAfter(previous.end()) ? interval.end() : previous.end()));
            }
        }
        for (Interval interval : merged) {
            Instant cursor = interval.start();
            while (cursor.isBefore(interval.end())) {
                LocalDate date = cursor.atZone(zone).toLocalDate();
                Instant boundary = date.plusDays(1).atStartOfDay(zone).toInstant();
                Instant end = interval.end().isBefore(boundary) ? interval.end() : boundary;
                days.computeIfAbsent(date, ignored -> new MutableDay()).focusSeconds += Duration.between(cursor, end).getSeconds();
                cursor = end;
            }
        }

        // Events are separate from current tasks: deleting a task does not erase actual past work.
        for (Completion completion : unique(completions, Completion::id)) {
            if (completion.revoked() || completion.at().isAfter(asOf)) continue;
            days.computeIfAbsent(completion.at().atZone(zone).toLocalDate(), ignored -> new MutableDay()).completedTasks++;
        }
        LocalDate today = asOf.atZone(zone).toLocalDate();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate cursor = qualifies(days.get(today)) ? today : today.minusDays(1);
        int streak = 0;
        while (qualifies(days.get(cursor))) { streak++; cursor = cursor.minusDays(1); }
        List<TaskState> activeTasks = unique(tasks, TaskState::id).stream().filter(task -> !task.deleted()).toList();
        int done = (int) activeTasks.stream().filter(task -> "DONE".equals(task.status())).count();
        List<DayActivity> daily = days.entrySet().stream().map(entry -> new DayActivity(entry.getKey(),
                entry.getValue().focusSeconds, entry.getValue().completedTasks, qualifies(entry.getValue()))).toList();
        return new Snapshot(VERSION, zone.getId(), asOf, streak,
                daily.stream().mapToLong(DayActivity::focusSeconds).sum(),
                daily.stream().filter(day -> !day.date().isBefore(weekStart)).mapToLong(DayActivity::focusSeconds).sum(),
                activeTasks.size(), done, activeTasks.isEmpty() ? null : (int) Math.round(done * 100.0 / activeTasks.size()), daily);
    }

    private static boolean qualifies(MutableDay day) {
        return day != null && (day.completedTasks > 0 || day.focusSeconds >= QUALIFYING_FOCUS_SECONDS);
    }

    private static <T> List<T> unique(List<T> values, java.util.function.Function<T, String> id) {
        Map<String, T> unique = new LinkedHashMap<>();
        for (T value : values) {
            String key = id.apply(value);
            if (key == null || key.isBlank()) throw new IllegalArgumentException("Missing activity ID");
            T previous = unique.putIfAbsent(key, value);
            if (previous != null && !previous.equals(value)) throw new IllegalArgumentException("Conflicting activity ID: " + key);
        }
        return List.copyOf(unique.values());
    }

    private static final class MutableDay { long focusSeconds; int completedTasks; }
    public record TaskState(String id, String status, boolean deleted) { }
    public record Completion(String id, String taskId, Instant at, boolean revoked) { }
    public record Interval(Instant start, Instant end) { }
    public record Session(String id, String status, List<Interval> segments) { }
    public record LegacyDuration(String id, Instant at, long seconds) { }
    public record DayActivity(LocalDate date, long focusSeconds, int completedTasks, boolean qualifies) { }
    public record Snapshot(String metricsVersion, String timezone, Instant asOf, int streak,
                           long totalFocusSeconds, long weekFocusSeconds, int totalTasks,
                           int completedTasks, Integer progressPercent, List<DayActivity> days) { }
}
