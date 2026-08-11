package com.huyberos.studymate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.huyberos.studymate.dto.request.RegisterRequest;
import com.huyberos.studymate.dto.request.ScheduleSlotRequest;
import com.huyberos.studymate.dto.request.SubjectRequest;
import com.huyberos.studymate.entity.enums.DayOfWeek;
import com.huyberos.studymate.entity.enums.ShiftType;
import com.huyberos.studymate.entity.enums.SubjectType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ScheduleSlotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;
    private Long subjectId;

    @BeforeEach
    void setUp() throws Exception {
        String email = "schedule_user_" + UUID.randomUUID().toString().substring(0, 8) + "@test.com";

        RegisterRequest regRequest = new RegisterRequest();
        regRequest.setEmail(email);
        regRequest.setPassword("123456");
        regRequest.setFullName("Schedule Tester");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regRequest)))
                .andReturn();

        String responseStr = result.getResponse().getContentAsString();
        token = objectMapper.readTree(responseStr).path("data").path("accessToken").asText();

        // Tạo môn học mẫu cho lịch học
        SubjectRequest subjectReq = new SubjectRequest();
        subjectReq.setName("Giải Tích 1");
        subjectReq.setColor("#3B82F6");
        subjectReq.setType(SubjectType.SCHOOL);
        subjectReq.setClassCode("MATH101");

        MvcResult subResult = mockMvc.perform(post("/api/subjects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(subjectReq)))
                .andReturn();

        subjectId = objectMapper.readTree(subResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();
    }

    @Test
    @DisplayName("Test CRUD Lịch học (ScheduleSlot)")
    void testScheduleSlotCrud() throws Exception {
        // 1. Tạo ô lịch học mới
        ScheduleSlotRequest createReq = new ScheduleSlotRequest();
        createReq.setSubjectId(subjectId);
        createReq.setDayOfWeek(DayOfWeek.THU_2);
        createReq.setShift(ShiftType.SANG);
        createReq.setStartTime(LocalTime.of(7, 0));
        createReq.setEndTime(LocalTime.of(9, 25));
        createReq.setRoom("A2-301");
        createReq.setTeacherName("ThS. Nguyen Van A");
        createReq.setIsRecurring(true);

        MvcResult createResult = mockMvc.perform(post("/api/schedule/manual")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.subjectId").value(subjectId))
                .andExpect(jsonPath("$.data.room").value("A2-301"))
                .andReturn();

        long slotId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // 2. Lấy danh sách lịch học
        mockMvc.perform(get("/api/schedule")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        // 3. Cập nhật lịch học (PUT)
        ScheduleSlotRequest updateReq = new ScheduleSlotRequest();
        updateReq.setSubjectId(subjectId);
        updateReq.setDayOfWeek(DayOfWeek.THU_4);
        updateReq.setShift(ShiftType.CHIEU);
        updateReq.setStartTime(LocalTime.of(12, 30));
        updateReq.setEndTime(LocalTime.of(14, 55));
        updateReq.setRoom("B1-102");
        updateReq.setTeacherName("ThS. Tran Van B");
        updateReq.setIsRecurring(true);

        mockMvc.perform(put("/api/schedule/" + slotId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.dayOfWeek").value("THU_4"))
                .andExpect(jsonPath("$.data.shift").value("CHIEU"))
                .andExpect(jsonPath("$.data.room").value("B1-102"))
                .andExpect(jsonPath("$.data.teacherName").value("ThS. Tran Van B"));

        // 4. Xóa lịch học (DELETE)
        mockMvc.perform(delete("/api/schedule/" + slotId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
