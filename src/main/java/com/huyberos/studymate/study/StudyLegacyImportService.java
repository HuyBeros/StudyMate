package com.huyberos.studymate.study;

import com.huyberos.studymate.exception.BadRequestException;
import com.huyberos.studymate.exception.ConflictException;
import com.huyberos.studymate.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.util.ArrayList;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class StudyLegacyImportService {
    private final StudyAccountCoordinator accounts;
    private final StudySessionRepository sessions;
    private final StudyPreferencesRepository preferences;
    private final SubjectRepository subjects;
    private final StudyReceipts receipts;
    private final Clock clock;

    @Transactional
    public StudyDtos.ImportResult importLegacy(UUID mutationId, StudyDtos.ImportLegacy request) {
        var user = accounts.lockCurrent();
        var replay = receipts.replay(user, mutationId, "LEGACY_IMPORT", request, StudyDtos.ImportResult.class);
        if (replay.isPresent()) return replay.get();
        var value = accounts.preferences(user);
        var acknowledged = new ArrayList<UUID>(); boolean changed = false;
        for (var input : request.sessions()) {
            if (input.completedAt().isAfter(clock.instant())) throw new BadRequestException("Phiên lịch sử có thời điểm trong tương lai.");
            String hash = receipts.hash(input);
            var existing = sessions.findByUserIdAndPublicId(user.getId(), input.publicId());
            if (existing.isPresent()) {
                if (existing.get().getProvenance() != StudyProvenance.LEGACY_DURATION || !hash.equals(existing.get().getLegacyHash()))
                    throw new ConflictException("ID phiên lịch sử đã có nội dung khác trên máy chủ. Bản gốc trên thiết bị được giữ lại.");
            } else {
                var session = new StudySession(); session.setPublicId(input.publicId()); session.setUser(user);
                session.setDeviceId(request.deviceId()); session.setStatus(StudySessionStatus.COMPLETED);
                session.setProvenance(StudyProvenance.LEGACY_DURATION); session.setEndedAt(input.completedAt());
                session.setTargetSeconds(Math.max(60, input.durationSeconds())); session.setLegacyDurationSeconds(input.durationSeconds()); session.setLegacyHash(hash);
                if (input.subjectId() != null) subjects.findByIdAndUserId(input.subjectId(), user.getId()).ifPresent(subject -> {
                    session.setSubjectId(subject.getId()); session.setSubjectName(subject.getName());
                });
                sessions.save(session); changed = true;
            }
            acknowledged.add(input.publicId());
        }
        boolean importedPreferences = request.preferences() != null && value.getLegacyImportedAt() == null && value.getPreferencesWrittenAt() == null;
        if (importedPreferences) {
            // A local preference import never changes the account timezone or a newer server edit.
            var p = request.preferences();
            value.setSchool(p.school().trim()); value.setMajor(p.major().trim()); value.setWeeklyGoalSeconds(p.weeklyGoalSeconds());
            value.setReminderEnabled(p.reminderEnabled()); value.setReminderLocalTime(java.time.LocalTime.parse(p.reminderTime()));
        }
        if (value.getLegacyImportedAt() == null) { value.setLegacyImportedAt(clock.instant()); changed = true; }
        preferences.saveAndFlush(value); sessions.flush();
        long revision = changed || importedPreferences ? accounts.bump(user) : accounts.state(user).getRevision();
        return receipts.remember(user, mutationId, "LEGACY_IMPORT", request, new StudyDtos.ImportResult(acknowledged, importedPreferences, revision));
    }
}
