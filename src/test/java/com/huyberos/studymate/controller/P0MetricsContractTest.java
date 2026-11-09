package com.huyberos.studymate.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.huyberos.studymate.study.StudyMetricsCalculator;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestFactory;

import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

class P0MetricsContractTest {
    @TestFactory
    Stream<DynamicTest> sharedGoldenFixtures() throws Exception {
        JsonNode root = new ObjectMapper().readTree(Path.of("contracts/metrics-v1/cases.json").toFile());
        List<DynamicTest> tests = new ArrayList<>();
        for (JsonNode fixture : root.path("cases")) {
            tests.add(DynamicTest.dynamicTest(fixture.path("id").asText(), () -> {
                var tasks = new ArrayList<StudyMetricsCalculator.TaskState>();
                for (var item : fixture.path("tasks")) tasks.add(new StudyMetricsCalculator.TaskState(item.path("id").asText(), item.path("status").asText(), item.path("deleted").asBoolean()));
                var completions = new ArrayList<StudyMetricsCalculator.Completion>();
                for (var item : fixture.path("completions")) completions.add(new StudyMetricsCalculator.Completion(item.path("id").asText(), item.path("taskId").asText(), Instant.parse(item.path("at").asText()), item.path("revoked").asBoolean()));
                var sessions = new ArrayList<StudyMetricsCalculator.Session>();
                for (var item : fixture.path("sessions")) {
                    var segments = new ArrayList<StudyMetricsCalculator.Interval>();
                    for (var segment : item.path("segments")) segments.add(new StudyMetricsCalculator.Interval(Instant.parse(segment.path("start").asText()), Instant.parse(segment.path("end").asText())));
                    sessions.add(new StudyMetricsCalculator.Session(item.path("id").asText(), item.path("status").asText(), segments));
                }
                var result = new StudyMetricsCalculator().calculate(tasks, completions, sessions,
                        ZoneId.of(fixture.path("timezone").asText()), Instant.parse(fixture.path("asOf").asText()));
                var expected = fixture.path("expected");
                assertEquals(root.path("metricsVersion").asText(), result.metricsVersion());
                assertEquals(expected.path("streak").asInt(), result.streak());
                assertEquals(expected.path("totalFocusSeconds").asLong(), result.totalFocusSeconds());
                assertEquals(expected.path("weekFocusSeconds").asLong(), result.weekFocusSeconds());
                assertEquals(expected.path("totalTasks").asInt(), result.totalTasks());
                assertEquals(expected.path("completedTasks").asInt(), result.completedTasks());
                if (expected.path("progressPercent").isNull()) assertNull(result.progressPercent());
                else assertEquals(expected.path("progressPercent").asInt(), result.progressPercent());
                if (expected.has("days")) {
                    assertEquals(expected.path("days").size(), result.days().size());
                    for (int index = 0; index < result.days().size(); index++) {
                        var day = result.days().get(index);
                        var wanted = expected.path("days").get(index);
                        assertEquals(wanted.path("date").asText(), day.date().toString());
                        assertEquals(wanted.path("focusSeconds").asLong(), day.focusSeconds());
                        assertEquals(wanted.path("completedTasks").asInt(), day.completedTasks());
                        assertEquals(wanted.path("qualifies").asBoolean(), day.qualifies());
                    }
                }
            }));
        }
        return tests.stream();
    }

    @Test
    void rejectsConflictingDuplicateIdsInsteadOfSilentlyDroppingAnEdit() {
        var first = new StudyMetricsCalculator.TaskState("task-1", "TODO", false);
        var second = new StudyMetricsCalculator.TaskState("task-1", "DONE", false);
        assertThrows(IllegalArgumentException.class, () -> new StudyMetricsCalculator().calculate(
                List.of(first, second), List.of(), List.of(), ZoneId.of("Asia/Ho_Chi_Minh"), Instant.parse("2026-11-04T12:00:00Z")));
    }
}
