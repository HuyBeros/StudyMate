package com.huyberos.studymate.controller;

import com.huyberos.studymate.config.SecurityConfig;
import com.huyberos.studymate.exception.GlobalExceptionHandler;
import com.huyberos.studymate.exception.JwtAuthenticationEntryPoint;
import com.huyberos.studymate.security.UserDetailsServiceImpl;
import com.huyberos.studymate.security.jwt.JwtAuthenticationFilter;
import com.huyberos.studymate.security.jwt.JwtUtil;
import com.huyberos.studymate.service.AuthService;
import com.huyberos.studymate.util.SecurityUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class,
        com.huyberos.studymate.config.JacksonConfig.class, GlobalExceptionHandler.class})
class P0AuthSecurityTest {
    @Autowired MockMvc mvc;
    @MockitoBean AuthService authService;
    @MockitoBean SecurityUtil securityUtil;
    @MockitoBean JwtUtil jwtUtil;
    @MockitoBean UserDetailsServiceImpl userDetailsService;

    @Test
    void profileMeLinkAndLogoutAllRequireAuthentication() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/auth/profile").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/google/link").contentType(MediaType.APPLICATION_JSON)
                .content("{\"provider\":\"GOOGLE\",\"token\":\"test\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/logout-all")).andExpect(status().isUnauthorized());
    }

    @Test
    void emailOnlyOAuthRequestsAreRejectedAtTheBoundary() throws Exception {
        mvc.perform(post("/api/auth/oauth2").contentType(MediaType.APPLICATION_JSON)
                .content("{\"provider\":\"GOOGLE\",\"email\":\"victim@example.test\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void facebookSampleRequestsAreRejected() throws Exception {
        mvc.perform(post("/api/auth/oauth2").contentType(MediaType.APPLICATION_JSON)
                .content("{\"provider\":\"FACEBOOK\",\"token\":\"fake\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void googleConfigIsPublicAndContainsNoCredentialSecret() throws Exception {
        mvc.perform(get("/api/auth/google/config")).andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.clientSecret").doesNotExist());
    }

    @Test
    void corsRejectsUnconfiguredOrigins() throws Exception {
        mvc.perform(options("/api/auth/oauth2").header("Origin", "https://attacker.example.test")
                .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }
}
