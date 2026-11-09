package com.huyberos.studymate.study;

import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.UserRepository;
import com.huyberos.studymate.util.SecurityUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.ZoneId;

/** All study/task writes and consistent snapshots acquire this account lock first. */
@Component
public class StudyAccountCoordinator {
    private final UserRepository users;
    private final SecurityUtil security;
    private final StudyPreferencesRepository preferences;
    private final StudyAccountStateRepository states;
    private final ZoneId legacyZone;

    public StudyAccountCoordinator(UserRepository users, SecurityUtil security, StudyPreferencesRepository preferences,
                                   StudyAccountStateRepository states,
                                   @Value("${app.study.legacy-timezone:Asia/Ho_Chi_Minh}") String legacyTimezone) {
        this.users = users; this.security = security; this.preferences = preferences; this.states = states;
        this.legacyZone = ZoneId.of(legacyTimezone);
    }

    public User lockCurrent() {
        Long id = security.getCurrentUser().getId();
        return users.findLockedById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public StudyPreferences preferences(User user) {
        return preferences.findByUserId(user.getId()).orElseGet(() -> {
            var value = new StudyPreferences(); value.setUser(user); value.setTimezone(legacyZone.getId());
            return preferences.saveAndFlush(value);
        });
    }

    public StudyAccountState state(User user) {
        return states.findByUserId(user.getId()).orElseGet(() -> {
            var value = new StudyAccountState(); value.setUser(user); return states.saveAndFlush(value);
        });
    }

    public long bump(User user) {
        var state = state(user); state.setRevision(state.getRevision() + 1); states.save(state); return state.getRevision();
    }

    public ZoneId legacyZone() { return legacyZone; }
}
