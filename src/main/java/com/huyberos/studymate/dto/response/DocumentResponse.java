package com.huyberos.studymate.dto.response;

import com.huyberos.studymate.entity.Document;
import com.huyberos.studymate.entity.enums.DocumentStatus;
import com.huyberos.studymate.entity.enums.FileType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DocumentResponse {

    private Long id;
    private Long subjectId;
    private String subjectName;
    private String subjectColor;

    private Long scheduleSlotId;
    private String fileName;
    private FileType fileType;
    private String fileUrl;
    private String extractedText;
    private LocalDateTime uploadDate;
    private DocumentStatus status;

    public static DocumentResponse fromEntity(Document doc, boolean includeText) {
        return DocumentResponse.builder()
                .id(doc.getId())
                .subjectId(doc.getSubject().getId())
                .subjectName(doc.getSubject().getName())
                .subjectColor(doc.getSubject().getColor())
                .scheduleSlotId(doc.getScheduleSlot() != null ? doc.getScheduleSlot().getId() : null)
                .fileName(doc.getFileName())
                .fileType(doc.getFileType())
                .fileUrl(doc.getFileUrl())
                .extractedText(includeText ? doc.getExtractedText() : null)
                .uploadDate(doc.getUploadDate())
                .status(doc.getStatus())
                .build();
    }
}
