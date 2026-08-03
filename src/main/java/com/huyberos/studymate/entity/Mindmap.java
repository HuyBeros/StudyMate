package com.huyberos.studymate.entity;

import com.huyberos.studymate.entity.enums.SourceType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "mindmap")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mindmap {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "mindmap_seq")
    @SequenceGenerator(name = "mindmap_seq", sequenceName = "mindmap_id_seq", allocationSize = 1)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, columnDefinition = "source_type")
    private SourceType sourceType;

    @Column(name = "source_id", nullable = false)
    private Long sourceId;

    @Column(nullable = false, length = 255)
    private String title;

    /**
     * Cấu trúc cây mindmap lưu dưới dạng JSONB.
     * Ví dụ: {"id":"root","label":"Chủ đề","children":[...]}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "structure", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> structure;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
