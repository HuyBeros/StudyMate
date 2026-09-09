package com.huyberos.studymate.service;

import com.huyberos.studymate.dto.request.LoginRequest;
import com.huyberos.studymate.dto.request.RefreshTokenRequest;
import com.huyberos.studymate.dto.request.RegisterRequest;
import com.huyberos.studymate.dto.response.AuthResponse;
import com.huyberos.studymate.entity.RefreshToken;
import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.entity.enums.AuthProvider;
import com.huyberos.studymate.exception.BadRequestException;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.RefreshTokenRepository;
import com.huyberos.studymate.repository.UserRepository;
import com.huyberos.studymate.security.jwt.JwtUtil;
import com.huyberos.studymate.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SecurityUtil securityUtil;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration; // ms

    // ── Register ──────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .provider(AuthProvider.LOCAL)
                .build();

        userRepository.save(user);
        return buildAuthResponse(user);
    }

    // ── Login ─────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Ném exception nếu sai email/password
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return buildAuthResponse(user);
    }

    // ── Refresh Token ─────────────────────────────────────

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BadRequestException("Invalid refresh token"));

        if (!stored.isValid()) {
            throw new BadRequestException("Refresh token expired or revoked");
        }

        // Thu hồi token cũ và cấp token mới (rotation)
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        return buildAuthResponse(user);
    }

    // ── Logout ────────────────────────────────────────────

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    @Transactional
    public void logoutAll(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    @Transactional
    public AuthResponse oauth2Login(com.huyberos.studymate.dto.request.OAuthLoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        log.info("[OAuth2 Login] provider={} email={}", request.getProvider(), email);

        try {
            User user = userRepository.findByEmail(email).orElseGet(() -> {
                AuthProvider provider = "FACEBOOK".equalsIgnoreCase(request.getProvider())
                        ? AuthProvider.FACEBOOK
                        : AuthProvider.GOOGLE;

                log.info("[OAuth2 Login] Creating new user: email={}, provider={}", email, provider);
                User newUser = User.builder()
                        .email(email)
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .fullName(request.getFullName() != null ? request.getFullName() : email.split("@")[0])
                        .avatarUrl(request.getAvatarUrl() != null ? request.getAvatarUrl() : "")
                        .provider(provider)
                        .build();
                return userRepository.save(newUser);
            });

            log.info("[OAuth2 Login] Success userId={}", user.getId());
            return buildAuthResponse(user);

        } catch (Exception e) {
            log.error("[OAuth2 Login] FAILED for email={}: {}", email, e.getMessage(), e);
            throw new BadRequestException("OAuth2 login failed. Please try again.");
        }
    }

    @Transactional
    public AuthResponse updateProfile(com.huyberos.studymate.dto.request.UserProfileRequest request) {
        Long userId = securityUtil.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));
        }

        User updated = userRepository.save(user);
        return buildAuthResponse(updated);
    }

    // ── Helper ────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail());
        String refreshTokenValue = generateAndSaveRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    private String generateAndSaveRefreshToken(User user) {
        String tokenValue = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now()
                .plusSeconds(refreshTokenExpiration / 1000);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(tokenValue)
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(refreshToken);
        return tokenValue;
    }
}
