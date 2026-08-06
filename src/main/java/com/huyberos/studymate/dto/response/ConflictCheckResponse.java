package com.huyberos.studymate.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConflictCheckResponse {
    private Boolean hasConflict;
    private String conflictType;
    private String message;
}
