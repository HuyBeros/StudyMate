package com.huyberos.studymate.dto.request;

import com.huyberos.studymate.entity.enums.SourceType;
import lombok.Data;
import java.util.Map;

@Data
public class MindmapSaveRequest {
    private SourceType sourceType;
    private Long sourceId;
    private String title;
    private Map<String, Object> structure;
}
