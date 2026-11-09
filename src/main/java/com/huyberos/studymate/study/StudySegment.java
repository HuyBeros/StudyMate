package com.huyberos.studymate.study;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name = "study_session_segment") @Getter @Setter @NoArgsConstructor
public class StudySegment {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "study_segment_seq")
    @SequenceGenerator(name = "study_segment_seq", sequenceName = "study_segment_id_seq", allocationSize = 1)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "session_id", nullable = false) private StudySession session;
    @Column(name = "started_at", nullable = false) private Instant startedAt;
    @Column(name = "ended_at") private Instant endedAt;
}
