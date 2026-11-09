package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.request.LoginRequest;
import com.huyberos.studymate.dto.request.ChangePasswordRequest;
import com.huyberos.studymate.dto.request.RefreshTokenRequest;
import com.huyberos.studymate.dto.request.RegisterRequest;
import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.dto.response.AuthResponse;
import com.huyberos.studymate.service.AuthService;
import com.huyberos.studymate.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SecurityUtil securityUtil;

    @Value("${google.client.id:}")
    private String googleWebClientId;

    @Value("${google.client.ids:${google.client.id:}}")
    private String googleClientIds;

    /**
     * POST /api/auth/register
     * Body: { username, password } or legacy { email, password, fullName }
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Registration successful", response));
    }

    /**
     * POST /api/auth/login
     * Body: { username, password } or { email, password }
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    /**
     * POST /api/auth/oauth2
     * Body: { provider: "GOOGLE", token: "Google ID token" }
     */
    @PostMapping("/oauth2")
    public ResponseEntity<ApiResponse<AuthResponse>> oauth2Login(
            @Valid @RequestBody com.huyberos.studymate.dto.request.OAuthLoginRequest request) {
        AuthResponse response = authService.oauth2Login(request);
        return ResponseEntity.ok(ApiResponse.ok("OAuth login successful", response));
    }

    @GetMapping("/google/config")
    public ResponseEntity<ApiResponse<GoogleConfig>> googleConfig() {
        boolean enabled = !googleWebClientId.isBlank() && java.util.Arrays.stream(googleClientIds.split(","))
                .map(String::trim).anyMatch(googleWebClientId::equals);
        return ResponseEntity.ok(ApiResponse.ok(new GoogleConfig(enabled, enabled ? googleWebClientId : "")));
    }

    @PostMapping("/google/link")
    public ResponseEntity<ApiResponse<AuthResponse>> linkGoogle(
            @Valid @RequestBody com.huyberos.studymate.dto.request.OAuthLoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Đã liên kết tài khoản Google.", authService.linkGoogle(request)));
    }

    public record GoogleConfig(boolean enabled, String clientId) { }

    /**
     * POST /api/auth/refresh
     * Body: { refreshToken }
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * POST /api/auth/logout
     * Body: { refreshToken }
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", null));
    }

    /**
     * POST /api/auth/logout-all  — đăng xuất tất cả thiết bị
     * Requires: Authorization header (JWT)
     */
    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<Void>> logoutAll() {
        authService.logoutAll(securityUtil.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.ok("Logged out from all devices", null));
    }

    // ── Me endpoint (test auth) ────────────────────────────

    /**
     * PUT /api/auth/profile — Cập nhật thông tin cá nhân
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<AuthResponse>> updateProfile(
            @Valid @RequestBody com.huyberos.studymate.dto.request.UserProfileRequest request) {
        AuthResponse response = authService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", response));
    }

    @PutMapping(value = "/profile/avatar", consumes = "multipart/form-data")
    public ApiResponse<AuthResponse> updateAvatar(@RequestParam("file") MultipartFile file,
                                                   @RequestParam(required = false) String fullName) {
        return ApiResponse.ok(authService.updateAvatar(file, fullName));
    }

    @GetMapping("/password")
    public ApiResponse<Boolean> hasPassword() {
        return ApiResponse.ok(authService.hasPassword());
    }

    @PutMapping("/password")
    public ApiResponse<AuthResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return ApiResponse.ok(authService.changePassword(request));
    }

    /**
     * GET /api/auth/me — kiểm tra token còn valid không
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<String>> me(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok("Authenticated as: " + userDetails.getUsername()));
    }

}

