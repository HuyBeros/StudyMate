package com.huyberos.studymate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.huyberos.studymate.dto.request.LoginRequest;
import com.huyberos.studymate.dto.request.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Test Đăng ký tài khoản mới thành công")
    void testRegisterSuccess() throws Exception {
        String uniqueEmail = "user_" + UUID.randomUUID().toString().substring(0, 8) + "@test.com";

        RegisterRequest request = new RegisterRequest();
        request.setEmail(uniqueEmail);
        request.setPassword("123456");
        request.setFullName("Test Integration User");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.email").value(uniqueEmail));
    }

    @Test
    @DisplayName("Test Đăng ký thất bại khi trùng Email")
    void testRegisterDuplicateEmail() throws Exception {
        String email = "duplicate_" + UUID.randomUUID().toString().substring(0, 8) + "@test.com";

        RegisterRequest request = new RegisterRequest();
        request.setEmail(email);
        request.setPassword("123456");
        request.setFullName("User 1");

        // Lần 1: đăng ký thành công
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));

        // Lần 2: trùng email -> phải báo lỗi 400
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Test Đăng nhập thành công trả về JWT Token")
    void testLoginSuccess() throws Exception {
        String email = "login_" + UUID.randomUUID().toString().substring(0, 8) + "@test.com";

        RegisterRequest regRequest = new RegisterRequest();
        regRequest.setEmail(email);
        regRequest.setPassword("myPassword123");
        regRequest.setFullName("Login User");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regRequest)));

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword("myPassword123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"));
    }
}
