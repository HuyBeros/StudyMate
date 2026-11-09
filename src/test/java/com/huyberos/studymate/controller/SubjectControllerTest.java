package com.huyberos.studymate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.huyberos.studymate.dto.request.RegisterRequest;
import com.huyberos.studymate.dto.request.SubjectRequest;
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

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SubjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;

    @BeforeEach
    void setUp() throws Exception {
        String email = "subject_user_" + UUID.randomUUID().toString().substring(0, 8) + "@test.com";

        RegisterRequest regRequest = new RegisterRequest();
        regRequest.setEmail(email);
        regRequest.setPassword("StudyTest123!");
        regRequest.setFullName("Subject Tester");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated()).andReturn();

        String responseStr = result.getResponse().getContentAsString();
        token = objectMapper.readTree(responseStr).path("data").path("accessToken").asText();
    }

    @Test
    @DisplayName("Test CRUD Môn học (Subject)")
    void testSubjectCrud() throws Exception {
        // 1. Tạo môn học mới
        SubjectRequest createReq = new SubjectRequest();
        createReq.setName("Cấu Trúc Dữ Liệu & Giải Thuật");
        createReq.setColor("#10B981");
        createReq.setType(SubjectType.SCHOOL);
        createReq.setClassCode("INT2203");

        MvcResult createResult = mockMvc.perform(post("/api/subjects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Cấu Trúc Dữ Liệu & Giải Thuật"))
                .andReturn();

        int subjectId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .path("data").path("id").asInt();

        // 2. Lấy danh sách môn học
        mockMvc.perform(get("/api/subjects")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        // 3. Cập nhật môn học (PUT)
        SubjectRequest updateReq = new SubjectRequest();
        updateReq.setName("Cấu Trúc Dữ Liệu Nâng Cao");
        updateReq.setColor("#EF4444");
        updateReq.setType(SubjectType.SELF_STUDY);
        updateReq.setClassCode("INT2203-ADV");

        mockMvc.perform(put("/api/subjects/" + subjectId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Cấu Trúc Dữ Liệu Nâng Cao"))
                .andExpect(jsonPath("$.data.color").value("#EF4444"))
                .andExpect(jsonPath("$.data.type").value("SELF_STUDY"));

        // 4. Xóa môn học
        mockMvc.perform(delete("/api/subjects/" + subjectId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
