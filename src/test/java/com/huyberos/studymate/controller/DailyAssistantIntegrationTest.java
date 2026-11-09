package com.huyberos.studymate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.huyberos.studymate.ai.AiRouter;
import com.huyberos.studymate.entity.ScheduleSlot;
import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.Task;
import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.entity.enums.DayOfWeek;
import com.huyberos.studymate.entity.enums.ShiftType;
import com.huyberos.studymate.entity.enums.TaskStatus;
import com.huyberos.studymate.repository.ScheduleSlotRepository;
import com.huyberos.studymate.repository.SubjectRepository;
import com.huyberos.studymate.repository.TaskRepository;
import com.huyberos.studymate.repository.UserRepository;
import com.huyberos.studymate.security.jwt.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("p1-integration")
@Transactional
class DailyAssistantIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JwtUtil jwt;
    @Autowired UserRepository users;
    @Autowired SubjectRepository subjects;
    @Autowired TaskRepository tasks;
    @Autowired ScheduleSlotRepository schedules;
    @MockitoBean Clock clock;
    @MockitoBean AiRouter ai;

    private User owner;
    private Subject course;
    private Subject foreignCourse;
    private final LocalDate today = LocalDate.of(2026, 11, 5);

    @BeforeEach
    void prepare() {
        when(clock.instant()).thenReturn(Instant.parse("2026-11-04T18:15:00Z"));
        owner = users.save(User.builder().username("assistant-test-owner").fullName("Test learner").build());
        var other = users.save(User.builder().username("assistant-test-other").fullName("Other learner").build());
        course = subjects.save(Subject.builder().user(owner).name("Đảm bảo chất lượng phần mềm").build());
        foreignCourse = subjects.save(Subject.builder().user(other).name("Môn của tài khoản khác").build());
    }

    @Test
    void todayUsesAccountZoneAndSeparatesOverdueWithoutLeakingAnotherUsersTasks() throws Exception {
        task(course, "Ca kiểm thử", today.atTime(17, 0), TaskStatus.TODO);
        task(course, "Hạn cũ", today.minusDays(1).atTime(17, 0), TaskStatus.TODO);
        task(course, "Việc đã làm", today.atTime(9, 0), TaskStatus.DONE);
        task(foreignCourse, "Việc riêng", today.atTime(9, 0), TaskStatus.TODO);

        ask("Hôm nay có những nhiệm vụ gì?")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.message").value(containsString("05/11/2026")))
                .andExpect(jsonPath("$.data.groups[0].total").value(1))
                .andExpect(jsonPath("$.data.groups[0].deadlines[0].title").value("Ca kiểm thử"))
                .andExpect(jsonPath("$.data.groups[1].total").value(1))
                .andExpect(jsonPath("$.data.groups[1].deadlines[0].title").value("Hạn cũ"));
        ask("Tuần này có bài nào sắp đến hạn?")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.groups[0].total").value(1));
        verifyNoInteractions(ai);
    }

    @Test
    void nextClassUsesRecurringAndDatedScheduleWithoutInventingHoursOrRooms() throws Exception {
        slot(course, today, DayOfWeek.THU_5, null, "Chưa đặt giờ", false);
        slot(course, null, DayOfWeek.THU_5, LocalTime.of(9, 0), null, true);
        slot(course, today.plusDays(1), DayOfWeek.THU_6, LocalTime.of(8, 0), "321 - A7", false);
        slot(foreignCourse, today, DayOfWeek.THU_5, LocalTime.of(7, 0), "Phòng riêng", false);

        ask("Tiết tiếp theo học ở đâu?")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.message").value(containsString("chưa ghi giờ")))
                .andExpect(jsonPath("$.data.groups[0].date").value("2026-11-05"))
                .andExpect(jsonPath("$.data.groups[0].lessons[0].startTime").value("09:00:00"))
                .andExpect(jsonPath("$.data.groups[0].lessons[0].room").isEmpty());
        ask("Lịch học ngày 06/11/2026")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.groups[0].total").value(1))
                .andExpect(jsonPath("$.data.groups[0].lessons[0].room").value("321 - A7"));
        ask("Tiết tiếp theo ngày mai học ở đâu?")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.groups[0].date").value("2026-11-06"))
                .andExpect(jsonPath("$.data.groups[0].lessons[0].room").value("321 - A7"));
        verifyNoInteractions(ai);
    }

    @Test
    void languageModelCanSelectReadIntentButCannotSupplyAnswerData() throws Exception {
        slot(course, today.plusDays(1), DayOfWeek.THU_6, LocalTime.of(8, 0), "307 - A9", false);
        when(ai.tryGenerateContent(anyString(), eq(true)))
                .thenReturn(Optional.of("{\"kind\":\"SCHEDULE\",\"period\":\"TOMORROW\"}"),
                        Optional.of("{\"kind\":\"SCHEDULE\",\"period\":\"TOMORROW\",\"room\":\"999\"}"));

        ask("Ngày kế tiếp tôi phải tới chỗ nào để dự lớp?")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.groups[0].lessons[0].room").value("307 - A9"));
        verify(ai).tryGenerateContent(anyString(), eq(true));
        ask("Có thể giúp tôi xem điều đó?")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.groups").isEmpty());
    }

    @Test
    void refusesWritesAndInvalidDatesAndRequiresAuthentication() throws Exception {
        mvc.perform(post("/api/assistant/ask").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"Lịch học hôm nay\"}"))
                .andExpect(status().isUnauthorized());
        ask("Xóa nhiệm vụ hôm nay").andExpect(status().isOk()).andExpect(jsonPath("$.data.groups").isEmpty());
        ask("Lịch học ngày 31/02/2026").andExpect(status().isOk()).andExpect(jsonPath("$.data.groups").isEmpty());
        ask("Lịch học ngày 26/10/26").andExpect(status().isOk()).andExpect(jsonPath("$.data.groups").isEmpty());
        verifyNoInteractions(ai);
    }

    private org.springframework.test.web.servlet.ResultActions ask(String question) throws Exception {
        return mvc.perform(post("/api/assistant/ask")
                .header("Authorization", "Bearer " + jwt.generateAccessToken(owner.getId(), null))
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("question", question))));
    }

    private void task(Subject subject, String title, LocalDateTime due, TaskStatus status) {
        tasks.save(Task.builder().user(subject.getUser()).subject(subject).title(title).dueAt(due).status(status).build());
    }

    private void slot(Subject subject, LocalDate date, DayOfWeek day, LocalTime start, String room, boolean repeats) {
        schedules.save(ScheduleSlot.builder().subject(subject).date(date).dayOfWeek(day).startTime(start)
                .room(room).shift(ShiftType.SANG).isRecurring(repeats).build());
    }
}
