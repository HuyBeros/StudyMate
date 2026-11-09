package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.request.OAuthLoginRequest;
import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.entity.enums.AuthProvider;
import com.huyberos.studymate.exception.ConflictException;
import com.huyberos.studymate.repository.RefreshTokenRepository;
import com.huyberos.studymate.repository.UserRepository;
import com.huyberos.studymate.security.GoogleIdentityVerifier;
import com.huyberos.studymate.security.jwt.JwtUtil;
import com.huyberos.studymate.service.AuthService;
import com.huyberos.studymate.util.SecurityUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class P0AuthServiceTest {
    @Mock UserRepository userRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock JwtUtil jwtUtil;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AuthenticationManager authenticationManager;
    @Mock SecurityUtil securityUtil;
    @Mock GoogleIdentityVerifier googleIdentityVerifier;
    @InjectMocks AuthService service;
    private OAuthLoginRequest request;
    private final GoogleIdentityVerifier.GoogleIdentity identity = new GoogleIdentityVerifier.GoogleIdentity(
            "verified-sub", "verified@example.test", "Verified Name", "https://example.test/avatar.png");

    @BeforeEach
    void setup() {
        request = new OAuthLoginRequest();
        request.setProvider("GOOGLE");
        request.setToken("signed-id-token");
    }

    @Test
    void ignoresAllClientProfileFieldsAndStoresVerifiedSubject() {
        request.setEmail("victim@example.test");
        request.setFullName("Forged Name");
        request.setAvatarUrl("https://attacker.example.test/avatar");
        when(googleIdentityVerifier.verify("signed-id-token")).thenReturn(identity);
        when(userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "verified-sub")).thenReturn(Optional.empty());
        when(userRepository.findByEmail(identity.email())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            assertEquals(identity.email(), user.getEmail());
            assertEquals(identity.fullName(), user.getFullName());
            assertEquals(identity.avatarUrl(), user.getAvatarUrl());
            assertEquals("verified-sub", user.getProviderId());
            assertNull(user.getPasswordHash());
            user.setId(11L);
            return user;
        });
        when(jwtUtil.generateAccessToken(11L, identity.email())).thenReturn("application-token");
        assertEquals(identity.email(), service.oauth2Login(request).getEmail());
        verify(userRepository, never()).findByEmail("victim@example.test");
    }

    @Test
    void existingIdentityUsesStableSubjectEvenIfGoogleEmailChanged() {
        var existing = User.builder().id(5L).email("original@example.test").provider(AuthProvider.GOOGLE).providerId("verified-sub").build();
        when(googleIdentityVerifier.verify(anyString())).thenReturn(identity);
        when(userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "verified-sub")).thenReturn(Optional.of(existing));
        assertEquals(5L, service.oauth2Login(request).getUserId());
        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, never()).save(any());
    }

    @Test
    void sameEmailDoesNotAutomaticallyLinkLocalOrLegacyGoogleAccounts() {
        when(googleIdentityVerifier.verify(anyString())).thenReturn(identity);
        when(userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "verified-sub")).thenReturn(Optional.empty());
        for (var provider : new AuthProvider[]{AuthProvider.LOCAL, AuthProvider.GOOGLE}) {
            when(userRepository.findByEmail(identity.email())).thenReturn(Optional.of(User.builder().id(4L).email(identity.email()).provider(provider).build()));
            assertThrows(ConflictException.class, () -> service.oauth2Login(request));
        }
        verifyNoInteractions(jwtUtil, refreshTokenRepository);
        verify(userRepository, never()).save(any());
    }

    @Test
    void invalidTokenCannotReadAnAccountOrMintApplicationTokens() {
        when(googleIdentityVerifier.verify(anyString())).thenThrow(new BadCredentialsException("invalid"));
        assertThrows(BadCredentialsException.class, () -> service.oauth2Login(request));
        verifyNoInteractions(userRepository, jwtUtil, refreshTokenRepository);
    }

    @Test
    void rejectsTheLegacyFacebookShortcut() {
        request.setProvider("FACEBOOK");
        assertThrows(com.huyberos.studymate.exception.BadRequestException.class, () -> service.oauth2Login(request));
        verifyNoInteractions(googleIdentityVerifier, userRepository, jwtUtil, refreshTokenRepository);
    }

    @Test
    void explicitLinkPreservesUserIdAndPassword() {
        var current = User.builder().id(7L).email(identity.email()).fullName("Chosen Name").provider(AuthProvider.LOCAL).passwordHash("existing-hash").build();
        when(securityUtil.getCurrentUser()).thenReturn(current);
        when(googleIdentityVerifier.verify(anyString())).thenReturn(identity);
        when(userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "verified-sub")).thenReturn(Optional.empty());
        assertEquals(7L, service.linkGoogle(request).getUserId());
        assertEquals("existing-hash", current.getPasswordHash());
        assertEquals("Chosen Name", current.getFullName());
        assertEquals("verified-sub", current.getProviderId());
        assertEquals(AuthProvider.GOOGLE, current.getProvider());
        verify(userRepository).save(current);
    }

    @Test
    void explicitLinkRequiresMatchingVerifiedEmail() {
        when(securityUtil.getCurrentUser()).thenReturn(User.builder().id(7L).email("victim@example.test").provider(AuthProvider.LOCAL).build());
        when(googleIdentityVerifier.verify(anyString())).thenReturn(identity);
        assertThrows(ConflictException.class, () -> service.linkGoogle(request));
        verifyNoInteractions(userRepository, jwtUtil, refreshTokenRepository);
    }

    @Test
    void explicitLinkCannotTakeAnIdentityAlreadyOwnedByAnotherUser() {
        when(securityUtil.getCurrentUser()).thenReturn(User.builder().id(7L).email(identity.email()).provider(AuthProvider.LOCAL).build());
        when(googleIdentityVerifier.verify(anyString())).thenReturn(identity);
        when(userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "verified-sub"))
                .thenReturn(Optional.of(User.builder().id(8L).email(identity.email()).provider(AuthProvider.GOOGLE).providerId("verified-sub").build()));
        assertThrows(ConflictException.class, () -> service.linkGoogle(request));
        verify(userRepository, never()).save(any());
        verifyNoInteractions(jwtUtil, refreshTokenRepository);
    }
}
