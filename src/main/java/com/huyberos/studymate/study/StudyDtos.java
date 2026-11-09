package com.huyberos.studymate.study;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class StudyDtos {
    private StudyDtos() { }
    public record CreateSession(@NotNull UUID publicId, @NotNull UUID deviceId, UUID taskId,
                                Long subjectId, @Min(60) @Max(14400) int targetSeconds) { }
    public enum Action { PAUSE, RESUME, COMPLETE, STOP, DISCARD }
    public record Transition(@NotNull Action action, @NotNull @Min(0) Long baseVersion) { }
    public record Session(UUID publicId, UUID deviceId, UUID taskPublicId, Long taskId, String taskTitle,
                          Long subjectId, String subjectName, StudySessionStatus status, int targetSeconds,
                          long focusSeconds, long remainingSeconds, Instant deadline, Instant startedAt,
                          Instant endedAt, long version, StudyProvenance provenance, Instant serverNow) { }
    public record Preferences(String school, String major, String timezone, int weeklyGoalSeconds,
                              boolean reminderEnabled, String reminderTime, long version, Instant legacyImportedAt) { }
    public record SavePreferences(@NotNull @Size(max=160) String school, @NotNull @Size(max=160) String major,
                                  @NotBlank @Size(max=64) String timezone,
                                  @Min(1800) @Max(604800) int weeklyGoalSeconds, boolean reminderEnabled,
                                  @NotBlank @Pattern(regexp="([01]\\d|2[0-3]):[0-5]\\d") String reminderTime,
                                  @NotNull @Min(0) Long version) { }
    public record LegacySession(@NotNull UUID publicId, Long subjectId, @NotNull @PastOrPresent Instant completedAt,
                                @Min(1) @Max(14400) int durationSeconds) { }
    public record ImportLegacy(@NotNull UUID deviceId, @NotNull @Size(max=100) List<@Valid LegacySession> sessions,
                               @Valid SavePreferences preferences) { }
    public record ImportResult(List<UUID> acknowledged, boolean preferencesImported, long syncRevision) { }
    public record Progress(int totalTasks, int completedTasks, Integer progressPercent) { }
    public record SubjectProgress(Long subjectId, String name, int totalTasks, int completedTasks, Integer progressPercent) { }
    public record Period(LocalDate from, LocalDate to, Long subjectId, long focusSeconds, long weekFocusSeconds,
                         long previousWeekFocusSeconds, Progress progress, Map<String, Long> taskStatus,
                         List<SubjectProgress> subjects, List<StudyMetricsCalculator.DayActivity> days) { }
    public record Metrics(String metricsVersion, String timezone, Instant asOf, long syncRevision,
                          int streak, long totalFocusSeconds, long weekFocusSeconds,
                          long previousWeekFocusSeconds, long legacyFocusSeconds,
                          Progress progress, Progress today, List<StudyMetricsCalculator.DayActivity> days, Period period) { }
    public record SessionPage(List<Session> items, int offset, int limit, boolean hasMore) { }
}
