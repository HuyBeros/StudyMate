package com.huyberos.studymate.study;

import com.huyberos.studymate.exception.BadRequestException;
import com.huyberos.studymate.exception.ConflictException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Objects;

@Service @RequiredArgsConstructor
public class StudyPreferencesService {
    private final StudyAccountCoordinator accounts;
    private final StudyPreferencesRepository preferences;
    private final Clock clock;

    @Transactional
    public StudyDtos.Preferences get() { return response(accounts.preferences(accounts.lockCurrent())); }

    @Transactional
    public StudyDtos.Preferences save(StudyDtos.SavePreferences request) {
        var user = accounts.lockCurrent(); var value = accounts.preferences(user);
        if (!Objects.equals(value.getVersion(), request.version())) throw new ConflictException("Mục tiêu đã được sửa trên thiết bị khác. Bản nhập của bạn vẫn được giữ; hãy tải lại để đối chiếu.");
        try { ZoneId.of(request.timezone()); } catch (Exception error) { throw new BadRequestException("Múi giờ không hợp lệ."); }
        apply(value, request); value.setPreferencesWrittenAt(clock.instant());
        preferences.saveAndFlush(value); accounts.bump(user); return response(value);
    }

    static void apply(StudyPreferences value, StudyDtos.SavePreferences request) {
        value.setSchool(request.school().trim()); value.setMajor(request.major().trim()); value.setTimezone(request.timezone());
        value.setWeeklyGoalSeconds(request.weeklyGoalSeconds()); value.setReminderEnabled(request.reminderEnabled());
        value.setReminderLocalTime(LocalTime.parse(request.reminderTime()));
    }

    static StudyDtos.Preferences response(StudyPreferences value) {
        return new StudyDtos.Preferences(value.getSchool(), value.getMajor(), value.getTimezone(), value.getWeeklyGoalSeconds(),
                value.isReminderEnabled(), value.getReminderLocalTime().toString().substring(0, 5), value.getVersion(), value.getLegacyImportedAt());
    }
}
