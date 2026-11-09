package com.huyberos.studymate.room;

import com.huyberos.studymate.exception.ConflictException;
import java.time.Duration;
import java.time.Instant;

record RoomTimer(Phase phase, Instant deadline, long remainingMs) {
    static final long FOCUS_MS = Duration.ofMinutes(25).toMillis();
    static final long BREAK_MS = Duration.ofMinutes(5).toMillis();
    enum Phase { WAITING, FOCUS, BREAK }
    enum Action { START, PAUSE, RESUME, RESET }

    static RoomTimer waiting() { return new RoomTimer(Phase.WAITING, null, 0); }

    RoomTimer at(Instant now) {
        if (deadline == null || deadline.isAfter(now)) return this;
        if (phase == Phase.FOCUS) {
            var breakEnd = deadline.plusMillis(BREAK_MS);
            if (breakEnd.isAfter(now)) return new RoomTimer(Phase.BREAK, breakEnd, 0);
        }
        return waiting();
    }

    RoomTimer command(Action action, Instant now) {
        return switch (action) {
            case START -> {
                require(phase == Phase.WAITING);
                yield new RoomTimer(Phase.FOCUS, now.plusMillis(FOCUS_MS), 0);
            }
            case PAUSE -> {
                require(deadline != null);
                yield new RoomTimer(phase, null, Duration.between(now, deadline).toMillis());
            }
            case RESUME -> {
                require(phase != Phase.WAITING && deadline == null);
                yield new RoomTimer(phase, now.plusMillis(remainingMs), 0);
            }
            case RESET -> waiting();
        };
    }

    long left(Instant now) {
        if (phase == Phase.WAITING) return FOCUS_MS;
        return deadline == null ? remainingMs : Math.max(0, Duration.between(now, deadline).toMillis());
    }

    private static void require(boolean valid) {
        if (!valid) throw new ConflictException("Đồng hồ đã đổi trạng thái. Hãy thử lại.");
    }
}
