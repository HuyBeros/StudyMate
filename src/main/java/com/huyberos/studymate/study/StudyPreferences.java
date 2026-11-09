package com.huyberos.studymate.study;

import com.huyberos.studymate.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.time.LocalTime;

@Entity @Table(name = "user_study_preferences")
@Getter @Setter @NoArgsConstructor
public class StudyPreferences {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "study_preferences_seq")
    @SequenceGenerator(name = "study_preferences_seq", sequenceName = "study_preferences_id_seq", allocationSize = 1)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    @Column(nullable = false, length = 64) private String timezone = "Asia/Ho_Chi_Minh";
    @Column(nullable = false, length = 160) private String school = "";
    @Column(nullable = false, length = 160) private String major = "";
    @Column(name = "weekly_goal_seconds", nullable = false) private int weeklyGoalSeconds = 21600;
    @Column(name = "reminder_enabled", nullable = false) private boolean reminderEnabled;
    @Column(name = "reminder_local_time", nullable = false) private LocalTime reminderLocalTime = LocalTime.of(19, 0);
    @Version private Long version;
    @Column(name = "legacy_imported_at") private Instant legacyImportedAt;
    @Column(name = "preferences_written_at") private Instant preferencesWrittenAt;
}
