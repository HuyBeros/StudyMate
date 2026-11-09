package com.huyberos.studymate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.enums.AuthProvider;
import com.huyberos.studymate.entity.enums.SubjectType;
import com.huyberos.studymate.repository.UserRepository;
import com.huyberos.studymate.repository.SubjectRepository;
import com.huyberos.studymate.study.*;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("p1-integration") @Transactional
class P1StudyIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository users;
    @Autowired SubjectRepository subjects;
    @Autowired StudySessionRepository sessions;
    @Autowired TaskCompletionEventRepository events;
    @Autowired StudyMutationReceiptRepository receipts;
    @Autowired EntityManager entityManager;
    @MockitoBean Clock clock;
    @Autowired org.springframework.web.context.WebApplicationContext context;
    @Autowired com.huyberos.studymate.security.jwt.JwtUtil jwt;
    private User owner;
    private final Instant start = Instant.parse("2026-11-04T02:00:00Z");

    @BeforeEach void prepare() {
        when(clock.instant()).thenReturn(start);
        owner = users.saveAndFlush(User.builder().email("p1-owner@example.test").fullName("P1 Owner").provider(AuthProvider.LOCAL).build());
        mvc = org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup(context)
                .defaultRequest(get("/").header("Authorization", "Bearer " + jwt.generateAccessToken(owner.getId(), owner.getEmail())))
                .apply(org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity()).build();
    }

    private String create(UUID id, UUID key, int target) throws Exception {
        return mvc.perform(post("/api/study/sessions").header("Idempotency-Key", key).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new StudyDtos.CreateSession(id, UUID.fromString("00000000-0000-0000-0000-000000000001"), null, null, target))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    }
    private org.springframework.test.web.servlet.ResultActions transition(UUID id, UUID key, String action, long version) throws Exception {
        return mvc.perform(post("/api/study/sessions/"+id+"/transitions").header("Idempotency-Key", key).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("action",action,"baseVersion",version))));
    }

    @Test void noGoalsAreNullAndSnapshotContainsOneVersionedSource() throws Exception {
        mvc.perform(get("/api/study/overview")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.metrics.metricsVersion").value("study-metrics-v1"))
                .andExpect(jsonPath("$.data.metrics.streak").value(0))
                .andExpect(jsonPath("$.data.metrics.progress.progressPercent").isEmpty())
                .andExpect(jsonPath("$.data.metrics.totalFocusSeconds").value(0))
                .andExpect(jsonPath("$.data.preferences.weeklyGoalSeconds").value(21600));
    }

    @Test void completedSessionPersistsAndRetryCannotDuplicateTime() throws Exception {
        UUID id=UUID.randomUUID(), createKey=UUID.randomUUID(), completeKey=UUID.randomUUID();
        String first=create(id,createKey,1500);
        assertEquals(mapper.readTree(first).path("data"),mapper.readTree(create(id,createKey,1500)).path("data"));
        when(clock.instant()).thenReturn(start.plusSeconds(1800));
        transition(id,completeKey,"COMPLETE",0).andExpect(status().isOk()).andExpect(jsonPath("$.data.focusSeconds").value(1500));
        transition(id,completeKey,"COMPLETE",0).andExpect(status().isOk());
        assertEquals(1,sessions.findByUserIdOrderByIdDesc(owner.getId()).size());
        assertEquals(2,receipts.countByUserId(owner.getId()));
        mvc.perform(get("/api/study/metrics")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalFocusSeconds").value(1500)).andExpect(jsonPath("$.data.streak").value(1));
    }

    @Test void overviewLoadsSessionSegmentsWithoutOneQueryPerSession() throws Exception {
        for (int i = 0; i < 6; i++) {
            Instant sessionStart = start.plusSeconds(i * 1800L);
            when(clock.instant()).thenReturn(sessionStart);
            UUID id = UUID.randomUUID();
            create(id, UUID.randomUUID(), 1500);
            when(clock.instant()).thenReturn(sessionStart.plusSeconds(1500));
            transition(id, UUID.randomUUID(), "COMPLETE", 0).andExpect(status().isOk());
        }
        entityManager.flush();
        entityManager.clear();

        var statistics = entityManager.getEntityManagerFactory().unwrap(SessionFactory.class).getStatistics();
        boolean wasEnabled = statistics.isStatisticsEnabled();
        statistics.setStatisticsEnabled(true);
        try {
            var segments = statistics.getCollectionStatistics(StudySession.class.getName() + ".segments");
            long before = segments.getFetchCount();
            mvc.perform(get("/api/study/overview")).andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.metrics.totalFocusSeconds").value(9000));
            assertEquals(before, segments.getFetchCount(), "Overview must fetch segments with their sessions");
        } finally {
            statistics.setStatisticsEnabled(wasEnabled);
        }
    }

    @Test void pauseResumeExcludesBreakAndOldVersionCannotOverwrite() throws Exception {
        UUID id=UUID.randomUUID();create(id,UUID.randomUUID(),1500);
        when(clock.instant()).thenReturn(start.plusSeconds(300));
        transition(id,UUID.randomUUID(),"PAUSE",0).andExpect(status().isOk()).andExpect(jsonPath("$.data.version").value(1));
        when(clock.instant()).thenReturn(start.plusSeconds(1200));
        transition(id,UUID.randomUUID(),"RESUME",0).andExpect(status().isConflict());
        transition(id,UUID.randomUUID(),"RESUME",1).andExpect(status().isOk());
        when(clock.instant()).thenReturn(start.plusSeconds(1500));
        transition(id,UUID.randomUUID(),"STOP",2).andExpect(status().isOk()).andExpect(jsonPath("$.data.focusSeconds").value(600));
        mvc.perform(get("/api/study/metrics")).andExpect(jsonPath("$.data.weekFocusSeconds").value(600)).andExpect(jsonPath("$.data.streak").value(1));
    }

    @Test void cannotCompleteEarlyOrCreateTwoActiveSessions() throws Exception {
        UUID id=UUID.randomUUID();create(id,UUID.randomUUID(),1500);
        transition(id,UUID.randomUUID(),"COMPLETE",0).andExpect(status().isBadRequest());
        mvc.perform(post("/api/study/sessions").header("Idempotency-Key",UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new StudyDtos.CreateSession(UUID.randomUUID(),UUID.randomUUID(),null,null,1500))))
                .andExpect(status().isConflict());
        mvc.perform(get("/api/study/sessions/active")).andExpect(jsonPath("$.data.publicId").value(id.toString()));
    }

    @Test void sameIdempotencyKeyWithDifferentBodyIsRejected() throws Exception {
        UUID id=UUID.randomUUID(),key=UUID.randomUUID();create(id,key,1500);
        mvc.perform(post("/api/study/sessions").header("Idempotency-Key",key).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new StudyDtos.CreateSession(id,UUID.fromString("00000000-0000-0000-0000-000000000001"),null,null,600))))
                .andExpect(status().isConflict());
    }

    @Test void anotherAccountsTaskCannotBeAttachedToASession() throws Exception {
        var other=users.save(User.builder().email("other-p1@example.test").provider(AuthProvider.LOCAL).build());
        var foreignTask=new com.huyberos.studymate.entity.Task();foreignTask.setUser(other);foreignTask.setTitle("Private");
        // Use the existing Task repository so the check exercises the actual ownership query.
        var saved=taskRepository.saveAndFlush(foreignTask);
        mvc.perform(post("/api/study/sessions").header("Idempotency-Key",UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new StudyDtos.CreateSession(UUID.randomUUID(),UUID.randomUUID(),saved.getPublicId(),null,1500))))
                .andExpect(status().isNotFound());
    }
    @Autowired com.huyberos.studymate.repository.TaskRepository taskRepository;

    @Test void completionEventSurvivesDeletionButUndoRevokesIt() throws Exception {
        var create=mvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"P1 task\",\"status\":\"TODO\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id=mapper.readTree(create).path("data").path("id").asLong();
        mvc.perform(patch("/api/tasks/"+id+"/status?status=DONE")).andExpect(status().isOk());
        mvc.perform(patch("/api/tasks/"+id+"/status?status=DONE")).andExpect(status().isOk());
        assertEquals(1,events.findByUserId(owner.getId()).size());
        mvc.perform(patch("/api/tasks/"+id+"/status?status=TODO")).andExpect(status().isOk());
        mvc.perform(get("/api/study/metrics")).andExpect(jsonPath("$.data.streak").value(0));
        mvc.perform(patch("/api/tasks/"+id+"/status?status=DONE")).andExpect(status().isOk());
        mvc.perform(delete("/api/tasks/"+id)).andExpect(status().isOk());
        mvc.perform(get("/api/study/metrics")).andExpect(jsonPath("$.data.streak").value(1)).andExpect(jsonPath("$.data.progress.totalTasks").value(0));
    }

    @Test void legacyDurationIsImportedOnceWithoutInventingSegments() throws Exception {
        UUID id=UUID.randomUUID();
        var body=mapper.writeValueAsString(new StudyDtos.ImportLegacy(UUID.randomUUID(),List.of(new StudyDtos.LegacySession(id,null,start.minusSeconds(1),1500)),null));
        for(int i=0;i<2;i++) mvc.perform(post("/api/study/import/legacy").header("Idempotency-Key",UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.acknowledged[0]").value(id.toString()));
        var saved=sessions.findByUserIdAndPublicId(owner.getId(),id).orElseThrow();
        assertNull(saved.getStartedAt());assertTrue(saved.getSegments().isEmpty());
        mvc.perform(get("/api/study/metrics")).andExpect(jsonPath("$.data.totalFocusSeconds").value(1500)).andExpect(jsonPath("$.data.legacyFocusSeconds").value(1500));
    }

    @Test void preferencesRejectStaleVersionAndLocalImportDoesNotOverwriteNewerServerSettings() throws Exception {
        mvc.perform(get("/api/study/preferences")).andExpect(status().isOk());
        var save=new StudyDtos.SavePreferences("Trường mới","CNTT","Asia/Ho_Chi_Minh",28800,true,"20:00",0L);
        mvc.perform(put("/api/study/preferences").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(save))).andExpect(status().isOk());
        mvc.perform(put("/api/study/preferences").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(save))).andExpect(status().isConflict());
        var old=new StudyDtos.SavePreferences("Trường cũ","","Asia/Ho_Chi_Minh",21600,false,"19:00",0L);
        mvc.perform(post("/api/study/import/legacy").header("Idempotency-Key",UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new StudyDtos.ImportLegacy(UUID.randomUUID(),List.of(),old))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.preferencesImported").value(false));
        mvc.perform(get("/api/study/preferences")).andExpect(jsonPath("$.data.school").value("Trường mới")).andExpect(jsonPath("$.data.weeklyGoalSeconds").value(28800));
    }

    @Test void invalidRangesAndMissingIdempotencyKeysDoNotReturnServerErrors() throws Exception {
        mvc.perform(get("/api/study/metrics?from=2026-11-05&to=2026-11-04")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/study/sessions").contentType(MediaType.APPLICATION_JSON).content("{}" )).andExpect(status().isBadRequest());
    }

    @Test void discardedSessionDoesNotCountAndAllStudyRoutesRequireAuthentication() throws Exception {
        UUID id=UUID.randomUUID();create(id,UUID.randomUUID(),1500);
        when(clock.instant()).thenReturn(start.plusSeconds(900));
        transition(id,UUID.randomUUID(),"DISCARD",0).andExpect(status().isOk());
        mvc.perform(get("/api/study/metrics")).andExpect(jsonPath("$.data.totalFocusSeconds").value(0)).andExpect(jsonPath("$.data.streak").value(0));
        for(String path:List.of("/overview","/metrics","/preferences","/sessions","/sessions/active"))
            mvc.perform(get("/api/study"+path).header("Authorization"," ")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/study/sessions").header("Authorization"," ")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/study/import/legacy").header("Authorization"," ")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/study/preferences").header("Authorization"," ")).andExpect(status().isUnauthorized());
    }

    @Test void subjectFilterCannotChangeGlobalStreakAndTaskInfersSessionSubject() throws Exception {
        var subject=subjects.saveAndFlush(Subject.builder().user(owner).name("P1 Maths").type(SubjectType.SCHOOL).build());
        var task=mvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Maths task\",\"subjectId\":"+subject.getId()+"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        var taskId=UUID.fromString(mapper.readTree(task).path("data").path("publicId").asText());
        var sessionId=UUID.randomUUID();
        mvc.perform(post("/api/study/sessions").header("Idempotency-Key",UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new StudyDtos.CreateSession(sessionId,UUID.randomUUID(),taskId,null,1500))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.subjectId").value(subject.getId()));
        when(clock.instant()).thenReturn(start.plusSeconds(1500)); transition(sessionId,UUID.randomUUID(),"COMPLETE",0).andExpect(status().isOk());
        mvc.perform(get("/api/study/overview?subjectId="+subject.getId()+"&from=2026-11-01&to=2026-11-03"))
                .andExpect(jsonPath("$.data.metrics.streak").value(1)).andExpect(jsonPath("$.data.metrics.totalFocusSeconds").value(1500))
                .andExpect(jsonPath("$.data.metrics.period.focusSeconds").value(0));
        var save=new StudyDtos.SavePreferences("","","UTC",21600,false,"19:00",0L);
        mvc.perform(put("/api/study/preferences").contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(save)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.timezone").value("UTC"));
        mvc.perform(get("/api/study/metrics")).andExpect(jsonPath("$.data.totalFocusSeconds").value(1500));
    }

    @Test void secondPrecisionKeepsRepeatedPausesConsistentWithMergedMetrics() throws Exception {
        when(clock.instant()).thenReturn(start.plusNanos(900_000_000));
        UUID id=UUID.randomUUID();create(id,UUID.randomUUID(),60);
        when(clock.instant()).thenReturn(start.plusSeconds(20).plusNanos(900_000_000));
        transition(id,UUID.randomUUID(),"PAUSE",0).andExpect(status().isOk());
        transition(id,UUID.randomUUID(),"RESUME",1).andExpect(status().isOk());
        when(clock.instant()).thenReturn(start.plusSeconds(40).plusNanos(900_000_000));
        transition(id,UUID.randomUUID(),"PAUSE",2).andExpect(status().isOk());
        transition(id,UUID.randomUUID(),"RESUME",3).andExpect(status().isOk());
        when(clock.instant()).thenReturn(start.plusSeconds(60).plusNanos(900_000_000));
        transition(id,UUID.randomUUID(),"COMPLETE",4).andExpect(status().isOk()).andExpect(jsonPath("$.data.focusSeconds").value(60));
        mvc.perform(get("/api/study/metrics")).andExpect(jsonPath("$.data.totalFocusSeconds").value(60));
    }

    @Test void anotherAccountCannotReadOrControlTheOwnersSession() throws Exception {
        UUID id=UUID.randomUUID();create(id,UUID.randomUUID(),1500);
        var other=users.saveAndFlush(User.builder().email("p1-reader@example.test").provider(AuthProvider.LOCAL).build());
        var bearer="Bearer "+jwt.generateAccessToken(other.getId(),other.getEmail());
        mvc.perform(get("/api/study/sessions/active").header("Authorization",bearer)).andExpect(status().isOk()).andExpect(jsonPath("$.data").isEmpty());
        mvc.perform(get("/api/study/metrics").header("Authorization",bearer)).andExpect(jsonPath("$.data.totalFocusSeconds").value(0));
        mvc.perform(post("/api/study/sessions/"+id+"/transitions").header("Authorization",bearer).header("Idempotency-Key",UUID.randomUUID())
                .contentType(MediaType.APPLICATION_JSON).content("{\"action\":\"PAUSE\",\"baseVersion\":0}"))
                .andExpect(status().isNotFound());
    }
}
