package com.huyberos.studymate.study;

import com.huyberos.studymate.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity @Table(name = "study_session", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "public_id"}))
@Getter @Setter @NoArgsConstructor
public class StudySession {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "study_session_seq")
    @SequenceGenerator(name = "study_session_seq", sequenceName = "study_session_id_seq", allocationSize = 1)
    private Long id;
    @Column(name = "public_id", nullable = false) private UUID publicId;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(name = "device_id", nullable = false) private UUID deviceId;
    @Column(name = "task_id") private Long taskId;
    @Column(name = "task_public_id") private UUID taskPublicId;
    @Column(name = "task_title", length = 255) private String taskTitle;
    @Column(name = "subject_id") private Long subjectId;
    @Column(name = "subject_name", length = 255) private String subjectName;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private StudySessionStatus status;
    @Column(name = "target_seconds", nullable = false) private int targetSeconds;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 24) private StudyProvenance provenance;
    @Column(name = "started_at") private Instant startedAt;
    @Column(name = "ended_at") private Instant endedAt;
    @Column(name = "legacy_duration_seconds") private Integer legacyDurationSeconds;
    @Column(name = "legacy_hash", length = 64) private String legacyHash;
    @Version private Long version;
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("startedAt ASC") private List<StudySegment> segments = new ArrayList<>();
}
