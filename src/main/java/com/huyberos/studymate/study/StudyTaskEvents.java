package com.huyberos.studymate.study;

import com.huyberos.studymate.entity.Task;
import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.entity.enums.TaskStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.UUID;

@Component @RequiredArgsConstructor
public class StudyTaskEvents {
    private final StudyAccountCoordinator accounts;
    private final TaskCompletionEventRepository events;
    private final Clock clock;

    public User lockAccount() { return accounts.lockCurrent(); }

    public void record(Task task, TaskStatus before) {
        var now = clock.instant();
        if (task.getStatus() == TaskStatus.DONE && before != TaskStatus.DONE) {
            var event = new TaskCompletionEvent();
            event.setPublicId(UUID.randomUUID()); event.setUser(task.getUser()); event.setTaskPublicId(task.getPublicId());
            event.setSubjectId(task.getSubject() == null ? null : task.getSubject().getId());
            event.setCompletedAt(now); event.setTimezoneAtEvent(accounts.preferences(task.getUser()).getTimezone());
            events.save(event);
            task.setCompletedAt(LocalDateTime.ofInstant(now, accounts.legacyZone()));
        } else if (before == TaskStatus.DONE && task.getStatus() != TaskStatus.DONE) {
            events.findByUserIdAndTaskPublicIdAndRevokedAtIsNull(task.getUser().getId(), task.getPublicId()).ifPresent(event -> {
                event.setRevokedAt(now); events.save(event);
            });
        }
        accounts.bump(task.getUser());
    }

    public void deleted(User user) { accounts.bump(user); }
}
