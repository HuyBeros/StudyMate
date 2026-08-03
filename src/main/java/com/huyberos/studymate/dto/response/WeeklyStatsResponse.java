package com.huyberos.studymate.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class WeeklyStatsResponse {

    private int totalTasksCompleted;
    private int totalTasksPending;
    private int totalNotesCreated;
    private int totalDocumentsUploaded;
    private Double averageQuizScore;

    private List<SubjectTaskStat> subjectTaskStats;

    @Data
    @Builder
    public static class SubjectTaskStat {
        private Long subjectId;
        private String subjectName;
        private String color;
        private long todoCount;
        private long doingCount;
        private long doneCount;
    }
}
