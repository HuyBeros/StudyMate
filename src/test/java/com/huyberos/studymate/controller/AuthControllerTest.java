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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.Map;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
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
    void profileUploadAndPasswordChangeHaveSeparateAuthenticatedFlows() throws Exception {
        String username = "profile_" + UUID.randomUUID().toString().substring(0, 8);
        String original = "StudyTest123!", replacement = "StudyTest456!";
        String signup = objectMapper.writeValueAsString(Map.of("username", username, "password", original));
        var registration = objectMapper.readTree(mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON).content(signup))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).path("data");
        String auth = "Bearer " + registration.path("accessToken").asText();
        String passwordPath = "/api/auth/password";
        mockMvc.perform(get(passwordPath)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(passwordPath).header("Authorization", auth))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data").value(true));
        mockMvc.perform(put("/api/auth/profile").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"New profile name\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.fullName").value("New profile name"))
                .andExpect(jsonPath("$.data.accessToken").doesNotExist());
        mockMvc.perform(multipart(org.springframework.http.HttpMethod.PUT, "/api/auth/profile/avatar")
                        .file(new MockMultipartFile("file", "bad.png", "image/png", new byte[] {1, 2}))
                        .header("Authorization", auth))
                .andExpect(status().isBadRequest());
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB), "png", bytes);
        mockMvc.perform(multipart(org.springframework.http.HttpMethod.PUT, "/api/auth/profile/avatar")
                        .file(new MockMultipartFile("file", "avatar.png", "image/png", bytes.toByteArray()))
                        .header("Authorization", auth))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.avatarUrl").value(
                        org.hamcrest.Matchers.startsWith("/uploads/avatars/")));
        mockMvc.perform(put(passwordPath).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("currentPassword", "Wrong", "newPassword", replacement))))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put(passwordPath).header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("currentPassword", original, "newPassword", replacement))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.refreshToken").isNotEmpty());
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("username", username, "password", replacement))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(signup))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Test Đăng ký tài khoản mới thành công")
    void testRegisterSuccess() throws Exception {
        String uniqueEmail = "user_" + UUID.randomUUID().toString().substring(0, 8) + "@test.com";

        RegisterRequest request = new RegisterRequest();
        request.setEmail(uniqueEmail);
        request.setPassword("StudyTest123!");
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
        request.setPassword("StudyTest123!");
        request.setFullName("User 1");

        // Lần 1: đăng ký thành công
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))).andExpect(status().isCreated());

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
        regRequest.setPassword("StudyTest123!");
        regRequest.setFullName("Login User");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regRequest))).andExpect(status().isCreated());

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword("StudyTest123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"));
    }

    @Test
    void usernameOnlyAccountCanRegisterLogInAndAccessStudyData() throws Exception {
        String username = "study_" + UUID.randomUUID().toString().substring(0, 8);
        String password = "StudyTest123!";
        String signup = objectMapper.writeValueAsString(java.util.Map.of("username", username, "password", password));

        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(signup))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.username").value(username))
                .andExpect(jsonPath("$.data.fullName").value(username))
                .andExpect(jsonPath("$.data.email").doesNotExist());

        String uppercaseLogin = objectMapper.writeValueAsString(java.util.Map.of(
                "username", username.toUpperCase(java.util.Locale.ROOT), "password", password));
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(uppercaseLogin))
                .andExpect(status().isConflict());

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(uppercaseLogin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value(username))
                .andReturn().getResponse().getContentAsString();
        String token = objectMapper.readTree(loginResponse).path("data").path("accessToken").asText();
        mockMvc.perform(get("/api/study/overview").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
