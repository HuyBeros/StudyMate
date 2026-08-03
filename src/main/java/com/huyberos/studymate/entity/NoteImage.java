package com.huyberos.studymate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "note_image")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteImage {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "note_image_seq")
    @SequenceGenerator(name = "note_image_seq", sequenceName = "note_image_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "position", nullable = false)
    @Builder.Default
    private Integer position = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
