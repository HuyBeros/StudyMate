package com.huyberos.studymate.assistant;

import com.huyberos.studymate.entity.Task;
import com.huyberos.studymate.repository.ScheduleSlotRepository;
import com.huyberos.studymate.repository.TaskRepository;
import com.huyberos.studymate.service.ScheduleSlotService;
import com.huyberos.studymate.study.StudyAccountCoordinator;
import com.huyberos.studymate.study.StudyPreferences;
import com.huyberos.studymate.study.StudyPreferencesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DailyAssistantData {
    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final int DISPLAY_LIMIT = 12;

    public record Lesson(long id, String subject, LocalDate date, LocalTime startTime, LocalTime endTime,
                         String periods, String room, boolean online) {}
    public record Deadline(long id, String title, String subject, LocalDateTime dueAt, boolean overdue) {}
    public record Group(String title, String target, LocalDate date, List<Lesson> lessons,
                        List<Deadline> deadlines, int total) {}
    public record Reply(String message, List<Group> groups) {}
    private record Range(LocalDate from, LocalDate to) {}

    private final TaskRepository tasks;
    private final ScheduleSlotRepository schedules;
    private final StudyPreferencesRepository preferences;
    private final StudyAccountCoordinator accounts;
    private final Clock clock;

    LocalDateTime localNow(long userId) {
        ZoneId zone = preferences.findByUserId(userId).map(StudyPreferences::getTimezone)
                .map(ZoneId::of).orElseGet(accounts::legacyZone);
        return LocalDateTime.ofInstant(clock.instant(), zone);
    }

    @Transactional(readOnly = true)
    public Reply answer(long userId, LocalDateTime now, DailyAssistantIntent.Query query) {
        if (query.kind() == DailyAssistantIntent.Kind.UNKNOWN) {
            return new Reply("Mình có thể tra lịch học, phòng học và nhiệm vụ đến hạn. Hãy thử hỏi “Lịch học ngày mai” hoặc nhập ngày theo dạng 26/10/2026.", List.of());
        }
        if (query.kind() == DailyAssistantIntent.Kind.NEXT_CLASS) return nextClass(userId, now, query);

        Range range = range(now.toLocalDate(), query);
        List<Group> groups = new ArrayList<>();
        switch (query.kind()) {
            case TASKS, OVERVIEW, UPCOMING_TASKS, OVERDUE_TASKS ->
                    groups.addAll(deadlines(userId, now, range, query.kind()));
            default -> {}
        }
        if (query.kind() == DailyAssistantIntent.Kind.SCHEDULE || query.kind() == DailyAssistantIntent.Kind.OVERVIEW) {
            groups.add(lessonsGroup("Lịch học", range.from(), lessons(userId, range)));
        }
        String dates = range.from().format(DISPLAY_DATE);
        if (!range.from().equals(range.to())) dates += " đến " + range.to().format(DISPLAY_DATE);
        String message = groups.stream().allMatch(group -> group.total() == 0)
                ? "Bạn không có kết quả phù hợp trong dữ liệu đã lưu cho ngày " + dates + "."
                : "Dữ liệu trong tài khoản của bạn cho ngày " + dates + ".";
        return new Reply(message, groups);
    }

    private Reply nextClass(long userId, LocalDateTime now, DailyAssistantIntent.Query query) {
        LocalDate today = now.toLocalDate();
        Range requested = query.period() != null || query.date() != null
                ? range(today, query) : new Range(today, today.plusDays(7));
        LocalDate from = requested.from().isBefore(today) ? today : requested.from();
        LocalDate end = requested.to();
        if (end.isBefore(from)) {
            return new Reply("Khoảng ngày đã qua. Hãy hỏi lịch học của ngày đó để xem các buổi đã lưu.",
                    List.of(lessonsGroup("Lịch học", requested.from(), List.of())));
        }
        List<Lesson> upcoming = lessons(userId, new Range(from, end));
        var next = upcoming.stream().filter(lesson -> lesson.startTime() != null)
                .filter(lesson -> !lesson.date().atTime(lesson.startTime()).isBefore(now)).findFirst();
        if (next.isEmpty()) {
            List<Lesson> untimed = upcoming.stream().filter(lesson -> lesson.startTime() == null).toList();
            if (!untimed.isEmpty()) return new Reply("Có buổi học chưa ghi giờ bắt đầu, nên mình chưa xác định được buổi tiếp theo.",
                    List.of(lessonsGroup("Buổi học chưa có giờ", untimed.getFirst().date(), untimed)));
            return new Reply("Bạn không có buổi học sắp tới trong khoảng ngày đã hỏi.",
                    List.of(lessonsGroup("Lịch học", from, List.of())));
        }
        Lesson first = next.get();
        boolean uncertain = upcoming.stream().anyMatch(lesson -> lesson.startTime() == null && !lesson.date().isAfter(first.date()));
        String message = uncertain ? "Đây là buổi có giờ bắt đầu gần nhất. Một số buổi cùng ngày hoặc trước đó chưa ghi giờ."
                : "Đây là buổi học tiếp theo của bạn.";
        List<Lesson> sameStart = upcoming.stream().filter(lesson -> lesson.date().equals(first.date())
                && first.startTime().equals(lesson.startTime())).toList();
        return new Reply(message, List.of(lessonsGroup("Buổi học tiếp theo", first.date(), sameStart)));
    }

    private List<Lesson> lessons(long userId, Range range) {
        List<Lesson> result = new ArrayList<>();
        range.from().datesUntil(range.to().plusDays(1)).forEach(date -> {
            var day = ScheduleSlotService.mapJavaDayOfWeekToEnum(date.getDayOfWeek());
            for (var slot : schedules.findTodaySlots(userId, day, date)) {
                result.add(new Lesson(slot.getId(), slot.getSubject().getName(), date, slot.getStartTime(),
                        slot.getEndTime(), slot.getPeriods(), slot.getRoom(), Boolean.TRUE.equals(slot.getIsOnline())));
            }
        });
        result.sort(Comparator.comparing(Lesson::date).thenComparing(Lesson::startTime,
                Comparator.nullsLast(Comparator.naturalOrder())).thenComparingLong(Lesson::id));
        return result;
    }

    private List<Group> deadlines(long userId, LocalDateTime now, Range range, DailyAssistantIntent.Kind kind) {
        boolean todayOnly = range.from().equals(now.toLocalDate()) && range.from().equals(range.to());
        LocalDateTime from = todayOnly ? LocalDate.of(1, 1, 1).atStartOfDay() : range.from().atStartOfDay();
        LocalDateTime to = range.to().plusDays(1).atStartOfDay();
        List<Deadline> entries = tasks.findPendingWithDeadline(userId, from, to).stream()
                .map(task -> deadline(task, now)).toList();
        if (kind == DailyAssistantIntent.Kind.UPCOMING_TASKS) {
            return List.of(deadlinesGroup("Sắp đến hạn", entries.stream().filter(item -> !item.overdue()).toList()));
        }
        if (kind == DailyAssistantIntent.Kind.OVERDUE_TASKS) {
            return List.of(deadlinesGroup("Quá hạn", entries.stream().filter(Deadline::overdue).toList()));
        }
        if (!todayOnly) return List.of(deadlinesGroup("Nhiệm vụ chưa xong theo hạn nộp", entries));
        return List.of(
                deadlinesGroup("Đến hạn hôm nay", entries.stream().filter(item -> !item.overdue()).toList()),
                deadlinesGroup("Quá hạn", entries.stream().filter(Deadline::overdue).toList()));
    }

    private static Deadline deadline(Task task, LocalDateTime now) {
        return new Deadline(task.getId(), task.getTitle(), task.getSubject() == null ? null : task.getSubject().getName(),
                task.getDueAt(), task.getDueAt().isBefore(now));
    }

    private static Group lessonsGroup(String title, LocalDate date, List<Lesson> items) {
        return new Group(title, "schedule", date, items.stream().limit(DISPLAY_LIMIT).toList(), List.of(), items.size());
    }

    private static Group deadlinesGroup(String title, List<Deadline> items) {
        return new Group(title, "tasks", null, List.of(), items.stream().limit(DISPLAY_LIMIT).toList(), items.size());
    }

    private static Range range(LocalDate today, DailyAssistantIntent.Query query) {
        if (query.date() != null) return new Range(query.date(), query.date());
        return switch (query.period()) {
            case TODAY -> new Range(today, today);
            case TOMORROW -> new Range(today.plusDays(1), today.plusDays(1));
            case YESTERDAY -> new Range(today.minusDays(1), today.minusDays(1));
            case THIS_WEEK, NEXT_WEEK -> {
                LocalDate start = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                if (query.period() == DailyAssistantIntent.Period.NEXT_WEEK) start = start.plusWeeks(1);
                yield new Range(start, start.plusDays(6));
            }
        };
    }
}
