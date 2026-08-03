package com.huyberos.studymate.entity;

import com.huyberos.studymate.entity.enums.DocumentStatus;
import com.huyberos.studymate.entity.enums.FileType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "document")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "document_seq")
    @SequenceGenerator(name = "document_seq", sequenceName = "document_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_slot_id")
    private ScheduleSlot scheduleSlot;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", nullable = false, columnDefinition = "file_type")
    private FileType fileType;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "extracted_text", columnDefinition = "text")
    private String extractedText;

    @CreationTimestamp
    @Column(name = "upload_date", nullable = false, updatable = false)
    private LocalDateTime uploadDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "document_status")
    @Builder.Default
    private DocumentStatus status = DocumentStatus.UPLOADED;
}
