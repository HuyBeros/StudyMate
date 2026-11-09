package com.huyberos.studymate.service;

import com.huyberos.studymate.dto.request.LoginRequest;
import com.huyberos.studymate.dto.request.RefreshTokenRequest;
import com.huyberos.studymate.dto.request.RegisterRequest;
import com.huyberos.studymate.dto.request.ChangePasswordRequest;
import com.huyberos.studymate.dto.response.AuthResponse;
import com.huyberos.studymate.entity.RefreshToken;
import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.entity.enums.AuthProvider;
import com.huyberos.studymate.exception.BadRequestException;
import com.huyberos.studymate.exception.ConflictException;
import com.huyberos.studymate.security.GoogleIdentityVerifier;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.RefreshTokenRepository;
import com.huyberos.studymate.repository.UserRepository;
import com.huyberos.studymate.security.jwt.JwtUtil;
import com.huyberos.studymate.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Locale;
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
    private final GoogleIdentityVerifier googleIdentityVerifier;
    private final FileStorageService fileStorageService;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration; // ms

    // ── Register ──────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername() == null ? null : request.getUsername().toLowerCase(Locale.ROOT);
        if (username != null && userRepository.existsByUsername(username)) {
            throw new ConflictException("Tên người dùng này đã được sử dụng.");
        }
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use");
        }

        User user = User.builder()
                .email(request.getEmail())
                .username(username)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(username != null ? username : request.getFullName())
                .provider(AuthProvider.LOCAL)
                .build();

        try {
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            if (ex.getCause() instanceof ConstraintViolationException violation
                    && "idx_app_user_username".equals(violation.getConstraintName())) {
                throw new ConflictException("Tên người dùng này đã được sử dụng.");
            }
            throw ex;
        }
        return buildAuthResponse(user);
    }

    // ── Login ─────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.loginIdentifier().trim();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, request.getPassword())
        );

        User user = userRepository.findByLogin(identifier)
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
        requireGoogle(request);
        var identity = googleIdentityVerifier.verify(request.getToken());
        User user = userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, identity.subject())
                .orElseGet(() -> {
                    // Email is not a linking credential, including for legacy email-only OAuth accounts.
                    if (userRepository.findByEmail(identity.email()).isPresent()) {
                        throw new ConflictException("Email này đã có tài khoản. Hãy đăng nhập tài khoản hiện có rồi chọn Liên kết Google trong Hồ sơ.");
                    }
                    return userRepository.save(User.builder()
                            .email(identity.email())
                            .fullName(identity.fullName())
                            .avatarUrl(identity.avatarUrl())
                            .provider(AuthProvider.GOOGLE)
                            .providerId(identity.subject())
                            .build());
                });
        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse linkGoogle(com.huyberos.studymate.dto.request.OAuthLoginRequest request) {
        User current = securityUtil.getCurrentUser();
        requireGoogle(request);
        var identity = googleIdentityVerifier.verify(request.getToken());
        if (!identity.email().equalsIgnoreCase(current.getEmail())) {
            throw new ConflictException("Hãy chọn tài khoản Google có cùng email với tài khoản đang đăng nhập.");
        }
        userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, identity.subject())
                .filter(existing -> !existing.getId().equals(current.getId()))
                .ifPresent(existing -> { throw new ConflictException("Tài khoản Google này đã được liên kết với một tài khoản khác."); });
        if (current.getProviderId() != null && !current.getProviderId().isBlank()
                && (current.getProvider() != AuthProvider.GOOGLE || !current.getProviderId().equals(identity.subject()))) {
            throw new ConflictException("Tài khoản đã liên kết với một danh tính khác. Không thể tự động thay thế.");
        }
        // Retain the existing password and user ID so linking does not lose data or email login.
        current.setProvider(AuthProvider.GOOGLE);
        current.setProviderId(identity.subject());
        userRepository.save(current);
        return buildAuthResponse(current);
    }

    private void requireGoogle(com.huyberos.studymate.dto.request.OAuthLoginRequest request) {
        if (!"GOOGLE".equals(request.getProvider())) {
            throw new BadRequestException("Phương thức đăng nhập này chưa được hỗ trợ.");
        }
    }

    @Transactional
    public AuthResponse updateProfile(com.huyberos.studymate.dto.request.UserProfileRequest request) {
        Long userId = securityUtil.getCurrentUserId();
        User user = userRepository.findLockedById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        User updated = userRepository.save(user);
        return profileResponse(updated).build();
    }

    @Transactional
    public AuthResponse updateAvatar(MultipartFile file, String fullName) {
        var user = userRepository.findLockedById(securityUtil.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));
        if (fullName != null && fullName.length() > 255) throw new BadRequestException("Họ tên quá dài.");
        user.setAvatarUrl(fileStorageService.storeAvatar(file));
        if (fullName != null && !fullName.isBlank()) user.setFullName(fullName.trim());
        return profileResponse(userRepository.save(user)).build();
    }

    public boolean hasPassword() {
        var hash = securityUtil.getCurrentUser().getPasswordHash();
        return hash != null && !hash.isBlank();
    }

    @Transactional
    public AuthResponse changePassword(ChangePasswordRequest request) {
        var user = userRepository.findLockedById(securityUtil.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));
        if (user.getPasswordHash() != null && !user.getPasswordHash().isBlank()
                && (request.currentPassword() == null || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash()))) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        refreshTokenRepository.revokeAllByUserId(user.getId());
        return buildAuthResponse(user);
    }

    // ── Helper ────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail());
        String refreshTokenValue = generateAndSaveRefreshToken(user);

        return profileResponse(user)
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .build();
    }

    private AuthResponse.AuthResponseBuilder profileResponse(User user) {
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl());
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
