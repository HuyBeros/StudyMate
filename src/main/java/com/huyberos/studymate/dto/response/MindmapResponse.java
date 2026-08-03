package com.huyberos.studymate.dto.response;

import com.huyberos.studymate.entity.Mindmap;
import com.huyberos.studymate.entity.enums.SourceType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class MindmapResponse {

    private Long id;
    private SourceType sourceType;
    private Long sourceId;
    private String title;
    private Map<String, Object> structure;
    private LocalDateTime createdAt;

    public static MindmapResponse fromEntity(Mindmap mindmap) {
        return MindmapResponse.builder()
                .id(mindmap.getId())
                .sourceType(mindmap.getSourceType())
                .sourceId(mindmap.getSourceId())
                .title(mindmap.getTitle())
                .structure(mindmap.getStructure())
                .createdAt(mindmap.getCreatedAt())
                .build();
    }
}
