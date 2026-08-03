package com.huyberos.studymate.dto.response;

import com.huyberos.studymate.entity.Note;
import com.huyberos.studymate.entity.enums.ImportanceLevel;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Data
@Builder
public class NoteResponse {

    private Long id;
    private Long subjectId;
    private String subjectName;
    private String subjectColor;

    private Long scheduleSlotId;
    private String title;
    private String content;
    private ImportanceLevel importanceLevel;
    private String aiSummary;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<NoteImageResponse> images;

    public static NoteResponse fromEntity(Note note) {
        List<NoteImageResponse> imageResponses = note.getImages() != null
                ? note.getImages().stream().map(NoteImageResponse::fromEntity).toList()
                : Collections.emptyList();

        return NoteResponse.builder()
                .id(note.getId())
                .subjectId(note.getSubject().getId())
                .subjectName(note.getSubject().getName())
                .subjectColor(note.getSubject().getColor())
                .scheduleSlotId(note.getScheduleSlot() != null ? note.getScheduleSlot().getId() : null)
                .title(note.getTitle())
                .content(note.getContent())
                .importanceLevel(note.getImportanceLevel())
                .aiSummary(note.getAiSummary())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .images(imageResponses)
                .build();
    }
}
