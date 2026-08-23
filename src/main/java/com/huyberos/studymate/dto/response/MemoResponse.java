package com.huyberos.studymate.dto.response;

import com.huyberos.studymate.entity.Memo;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class MemoResponse {

    private Long id;
    private String content;
    private Long taskId;
    private Long subjectId;
    private LocalDate date;
    private LocalDateTime createdAt;

    public static MemoResponse fromEntity(Memo memo) {
        return MemoResponse.builder()
                .id(memo.getId())
                .content(memo.getContent())
                .taskId(memo.getTask() != null ? memo.getTask().getId() : null)
                .subjectId(memo.getSubject() != null ? memo.getSubject().getId() : null)
                .date(memo.getDate())
                .createdAt(memo.getCreatedAt())
                .build();
    }
}
