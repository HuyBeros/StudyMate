package com.huyberos.studymate.study;

import com.huyberos.studymate.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "study_mutation_receipt", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "mutation_id"}))
@Getter @Setter @NoArgsConstructor
public class StudyMutationReceipt {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "study_receipt_seq")
    @SequenceGenerator(name = "study_receipt_seq", sequenceName = "study_receipt_id_seq", allocationSize = 1)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false) private User user;
    @Column(name = "mutation_id", nullable = false) private UUID mutationId;
    @Column(nullable = false, length = 80) private String operation;
    @Column(name = "request_hash", nullable = false, length = 64) private String requestHash;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "response_json", nullable = false, columnDefinition = "jsonb") private String responseJson;
    @Column(name = "created_at", nullable = false) private Instant createdAt;
}
