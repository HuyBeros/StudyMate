package com.huyberos.studymate.dto.request;

import com.huyberos.studymate.entity.enums.SourceType;
import lombok.Data;

@Data
public class SummarySaveRequest {
    private SourceType sourceType;
    private Long sourceId;
    private String title;
    private String summary;
}
