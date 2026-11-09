package com.huyberos.studymate.study;

import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.exception.BadRequestException;
import com.huyberos.studymate.exception.ConflictException;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.SubjectRepository;
import com.huyberos.studymate.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class StudySessionService {
    private final StudyAccountCoordinator accounts;
    private final StudySessionRepository sessions;
    private final TaskRepository tasks;
    private final SubjectRepository subjects;
    private final StudyReceipts receipts;
    private final Clock clock;

    @Transactional
    public StudyDtos.Session create(UUID mutationId, StudyDtos.CreateSession request) {
        var user = accounts.lockCurrent();
        var replay = receipts.replay(user, mutationId, "SESSION_CREATE", request, StudyDtos.Session.class);
        if (replay.isPresent()) return replay.get();
        if (sessions.findByUserIdAndPublicId(user.getId(), request.publicId()).isPresent())
            throw new ConflictException("ID phiên đã được sử dụng. Hãy tải lại trạng thái phiên.");
        if (!sessions.findByUserIdAndStatusIn(user.getId(), List.of(StudySessionStatus.RUNNING, StudySessionStatus.PAUSED)).isEmpty())
            throw new ConflictException("Bạn đang có một phiên trên thiết bị khác. Hãy tiếp tục hoặc kết thúc phiên đó trước.");
        var session = new StudySession(); session.setPublicId(request.publicId()); session.setUser(user);
        session.setDeviceId(request.deviceId()); session.setTargetSeconds(request.targetSeconds());
        session.setProvenance(StudyProvenance.TRACKED); session.setStatus(StudySessionStatus.RUNNING);
        Subject subject = null;
        if (request.taskId() != null) {
            var task = tasks.findByPublicIdAndUserId(request.taskId(), user.getId()).filter(value -> !value.isDeleted())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhiệm vụ."));
            subject = task.getSubject();
            if (request.subjectId() != null && (subject == null || !request.subjectId().equals(subject.getId())))
                throw new BadRequestException("Môn của phiên phải trùng với môn của nhiệm vụ.");
            session.setTaskId(task.getId()); session.setTaskPublicId(task.getPublicId()); session.setTaskTitle(task.getTitle());
        } else if (request.subjectId() != null) {
            subject = subjects.findByIdAndUserId(request.subjectId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy môn học."));
        }
        if (subject != null) { session.setSubjectId(subject.getId()); session.setSubjectName(subject.getName()); }
        var now = sessionNow(); session.setStartedAt(now); openSegment(session, now);
        sessions.saveAndFlush(session); accounts.preferences(user); accounts.bump(user);
        return receipts.remember(user, mutationId, "SESSION_CREATE", request, response(session, now));
    }

    @Transactional
    public StudyDtos.Session transition(UUID publicId, UUID mutationId, StudyDtos.Transition request) {
        var user = accounts.lockCurrent();
        String operation = "SESSION_TRANSITION:" + publicId;
        var replay = receipts.replay(user, mutationId, operation, request, StudyDtos.Session.class);
        if (replay.isPresent()) return replay.get();
        var session = sessions.findByUserIdAndPublicId(user.getId(), publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên học."));
        if (!Objects.equals(session.getVersion(), request.baseVersion()))
            throw new ConflictException("Phiên đã thay đổi trên thiết bị khác. Hãy tải lại trước khi thao tác.");
        if (session.getProvenance() != StudyProvenance.TRACKED)
            throw new ConflictException("Không thể điều khiển phiên lịch sử đã nhập.");
        var now = sessionNow();
        switch (request.action()) {
            case PAUSE -> {
                requireStatus(session, StudySessionStatus.RUNNING);
                closeSegment(session, now);
                if (focusSeconds(session, now) >= session.getTargetSeconds()) finish(session, StudySessionStatus.COMPLETED, now);
                else session.setStatus(StudySessionStatus.PAUSED);
            }
            case RESUME -> { requireStatus(session, StudySessionStatus.PAUSED); session.setStatus(StudySessionStatus.RUNNING); openSegment(session, now); }
            case COMPLETE -> {
                requireActive(session);
                if (focusSeconds(session, now) < session.getTargetSeconds()) throw new BadRequestException("Phiên chưa đủ thời gian. Dùng Dừng và lưu nếu muốn kết thúc sớm.");
                closeSegment(session, now); finish(session, StudySessionStatus.COMPLETED, now);
            }
            case STOP -> { requireActive(session); closeSegment(session, now); finish(session, StudySessionStatus.STOPPED, now); }
            case DISCARD -> { requireActive(session); closeSegment(session, now); finish(session, StudySessionStatus.DISCARDED, now); }
        }
        sessions.saveAndFlush(session); accounts.bump(user);
        return receipts.remember(user, mutationId, operation, request, response(session, now));
    }

    @Transactional
    public StudyDtos.Session active() {
        var user = accounts.lockCurrent();
        return sessions.findByUserIdAndStatusIn(user.getId(), List.of(StudySessionStatus.RUNNING, StudySessionStatus.PAUSED))
                .stream().findFirst().map(value -> response(value, clock.instant())).orElse(null);
    }

    @Transactional
    public StudyDtos.SessionPage list(LocalDate from, LocalDate to, Long subjectId, int offset, int limit) {
        if (offset < 0 || limit < 1 || limit > 100) throw new BadRequestException("Phân trang không hợp lệ.");
        if (from != null && to != null && from.isAfter(to)) throw new BadRequestException("Khoảng ngày không hợp lệ.");
        var user = accounts.lockCurrent();
        if (subjectId != null) subjects.findByIdAndUserId(subjectId, user.getId()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy môn học."));
        ZoneId zone = ZoneId.of(accounts.preferences(user).getTimezone());
        var now = clock.instant();
        var filtered = sessions.findByUserIdOrderByIdDesc(user.getId()).stream()
                .filter(value -> subjectId == null || subjectId.equals(value.getSubjectId()))
                .filter(value -> {
                    var at = value.getEndedAt() != null ? value.getEndedAt() : value.getStartedAt();
                    var day = at.atZone(zone).toLocalDate();
                    return (from == null || !day.isBefore(from)) && (to == null || !day.isAfter(to));
                }).skip(offset).limit(limit + 1L).toList();
        return new StudyDtos.SessionPage(filtered.stream().limit(limit).map(value -> response(value, now)).toList(), offset, limit, filtered.size() > limit);
    }

    static long focusSeconds(StudySession session, Instant now) {
        if (session.getProvenance() == StudyProvenance.LEGACY_DURATION) return session.getLegacyDurationSeconds();
        long closed = session.getSegments().stream().filter(segment -> segment.getEndedAt() != null)
                .mapToLong(segment -> Math.max(0, Duration.between(segment.getStartedAt(), segment.getEndedAt()).getSeconds())).sum();
        long running = session.getSegments().stream().filter(segment -> segment.getEndedAt() == null)
                .mapToLong(segment -> Math.max(0, Duration.between(segment.getStartedAt(), now).getSeconds())).sum();
        return Math.min(session.getTargetSeconds(), closed + running);
    }

    static StudyDtos.Session response(StudySession value, Instant now) {
        long focus = focusSeconds(value, now);
        long remaining = Math.max(0, value.getTargetSeconds() - focus);
        Instant deadline = null;
        if (value.getStatus() == StudySessionStatus.RUNNING) {
            long closed = value.getSegments().stream().filter(segment -> segment.getEndedAt() != null)
                    .mapToLong(segment -> Duration.between(segment.getStartedAt(), segment.getEndedAt()).getSeconds()).sum();
            deadline = value.getSegments().stream().filter(segment -> segment.getEndedAt() == null).findFirst()
                    .map(segment -> segment.getStartedAt().plusSeconds(Math.max(0, value.getTargetSeconds() - closed))).orElse(null);
        }
        return new StudyDtos.Session(value.getPublicId(), value.getDeviceId(), value.getTaskPublicId(), value.getTaskId(), value.getTaskTitle(),
                value.getSubjectId(), value.getSubjectName(), value.getStatus(), value.getTargetSeconds(), focus, remaining, deadline,
                value.getStartedAt(), value.getEndedAt(), value.getVersion(), value.getProvenance(), now);
    }

    private void openSegment(StudySession session, Instant now) {
        var segment = new StudySegment(); segment.setSession(session); segment.setStartedAt(now); session.getSegments().add(segment);
    }

    // Persist tracked interval boundaries at the contract's second precision so pause/resume
    // cannot accumulate fractional rounding differences between timer and merged metrics.
    private Instant sessionNow() { return clock.instant().truncatedTo(java.time.temporal.ChronoUnit.SECONDS); }

    private void closeSegment(StudySession session, Instant now) {
        long closed = session.getSegments().stream().filter(segment -> segment.getEndedAt() != null)
                .mapToLong(segment -> Duration.between(segment.getStartedAt(), segment.getEndedAt()).getSeconds()).sum();
        for (var segment : session.getSegments()) if (segment.getEndedAt() == null) {
            var cap = segment.getStartedAt().plusSeconds(Math.max(0, session.getTargetSeconds() - closed));
            var end = now.isBefore(cap) ? now : cap;
            if (end.isBefore(segment.getStartedAt())) throw new ConflictException("Đồng hồ máy chủ thay đổi. Hãy thử lại.");
            segment.setEndedAt(end);
        }
    }

    private void finish(StudySession session, StudySessionStatus status, Instant now) {
        session.setStatus(status);
        session.setEndedAt(session.getSegments().stream().map(StudySegment::getEndedAt).filter(Objects::nonNull).max(Instant::compareTo).orElse(now));
    }

    private void requireStatus(StudySession session, StudySessionStatus status) {
        if (session.getStatus() != status) throw new ConflictException("Trạng thái phiên không cho phép thao tác này.");
    }
    private void requireActive(StudySession session) {
        if (session.getStatus() != StudySessionStatus.RUNNING && session.getStatus() != StudySessionStatus.PAUSED)
            throw new ConflictException("Phiên đã kết thúc. Hãy tải lại trạng thái.");
    }
}
