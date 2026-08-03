package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.request.LoginRequest;
import com.huyberos.studymate.dto.request.RefreshTokenRequest;
import com.huyberos.studymate.dto.request.RegisterRequest;
import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.dto.response.AuthResponse;
import com.huyberos.studymate.service.AuthService;
import com.huyberos.studymate.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SecurityUtil securityUtil;

    /**
     * POST /api/auth/register
     * Body: { email, password, fullName }
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
     * Body: { email, password }
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

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
     * GET /api/auth/me — kiểm tra token còn valid không
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<String>> me(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok("Authenticated as: " + userDetails.getUsername()));
    }

}

