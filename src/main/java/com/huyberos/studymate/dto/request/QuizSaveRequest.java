package com.huyberos.studymate.dto.request;

import com.huyberos.studymate.entity.enums.SourceType;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class QuizSaveRequest {
    private SourceType sourceType;
    private Long sourceId;
    private String title;
    private List<Map<String, String>> questions;
}
