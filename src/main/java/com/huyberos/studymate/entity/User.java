package com.huyberos.studymate.entity;

import com.huyberos.studymate.entity.enums.AuthProvider;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "app_user_seq")
    @SequenceGenerator(name = "app_user_seq", sequenceName = "app_user_id_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    /**
     * Nullable — chỉ có giá trị khi provider = LOCAL.
     * OAuth users (Google/Facebook) không có password.
     */
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "auth_provider")
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    /**
     * ID định danh từ Google/Facebook (sub claim trong JWT của họ).
     * Null khi provider = LOCAL.
     */
    @Column(name = "provider_id", length = 255)
    private String providerId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ── Relations ──────────────────────────────────────────
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Subject> subjects = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuizAttempt> quizAttempts = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RefreshToken> refreshTokens = new ArrayList<>();
}
