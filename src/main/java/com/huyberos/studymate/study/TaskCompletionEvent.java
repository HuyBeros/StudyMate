package com.huyberos.studymate.study;

import com.huyberos.studymate.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "task_completion_event") @Getter @Setter @NoArgsConstructor
public class TaskCompletionEvent {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "study_completion_seq")
    @SequenceGenerator(name = "study_completion_seq", sequenceName = "study_completion_id_seq", allocationSize = 1)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true) private UUID publicId;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(name = "task_public_id", nullable = false) private UUID taskPublicId;
    @Column(name = "subject_id") private Long subjectId;
    @Column(name = "completed_at", nullable = false) private Instant completedAt;
    @Column(name = "revoked_at") private Instant revokedAt;
    @Column(name = "timezone_at_event", nullable = false, length = 64) private String timezoneAtEvent;
}
