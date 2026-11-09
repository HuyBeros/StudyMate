package com.huyberos.studymate.security;

import com.huyberos.studymate.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/** Verifies Google's signature before trusting any identity or profile claim. */
@Component
public class GoogleIdentityVerifier {
    private final JwtDecoder decoder;
    private final Set<String> clientIds;

    public GoogleIdentityVerifier(
            @Qualifier("googleIdTokenDecoder") JwtDecoder decoder,
            @Value("${google.client.ids:${google.client.id:}}") String clientIds) {
        this.decoder = decoder;
        this.clientIds = Arrays.stream(clientIds.split(","))
                .map(String::trim).filter(value -> !value.isBlank()).collect(Collectors.toUnmodifiableSet());
    }

    public GoogleIdentity verify(String token) {
        if (clientIds.isEmpty()) {
            throw new ServiceUnavailableException("Đăng nhập Google chưa được cấu hình trên máy chủ.");
        }
        if (token == null || token.isBlank() || token.length() > 16384) throw invalidToken();
        final Jwt jwt;
        try {
            // Nimbus checks the RS256 signature using Google's cached, rotating public keys.
            jwt = decoder.decode(token);
        } catch (JwtException | IllegalArgumentException exception) {
            throw invalidToken();
        }
        try {
            Instant now = Instant.now();
            String issuer = jwt.getClaimAsString("iss");
            String subject = jwt.getSubject();
            String email = jwt.getClaimAsString("email");
            String authorizedParty = jwt.getClaimAsString("azp");
            var audiences = jwt.getAudience();
            if (!("https://accounts.google.com".equals(issuer) || "accounts.google.com".equals(issuer))
                    || audiences == null || audiences.isEmpty() || audiences.stream().noneMatch(clientIds::contains)
                    || (authorizedParty != null && !clientIds.contains(authorizedParty))
                    || (audiences.size() > 1 && authorizedParty == null)
                    || jwt.getExpiresAt() == null || !jwt.getExpiresAt().isAfter(now)
                    || jwt.getIssuedAt() == null || jwt.getIssuedAt().isAfter(now.plusSeconds(30))
                    || (jwt.getNotBefore() != null && jwt.getNotBefore().isAfter(now.plusSeconds(30)))
                    || subject == null || subject.isBlank() || subject.length() > 255
                    || email == null || email.isBlank() || email.length() > 255 || !email.contains("@")
                    || !Boolean.TRUE.equals(jwt.getClaims().get("email_verified"))) {
                throw invalidToken();
            }
            String name = jwt.getClaimAsString("name");
            String picture = jwt.getClaimAsString("picture");
            return new GoogleIdentity(subject, email.trim().toLowerCase(Locale.ROOT),
                    name == null || name.isBlank() ? email.split("@")[0] : name.substring(0, Math.min(name.length(), 255)),
                    picture != null && picture.startsWith("https://") && picture.length() <= 500 ? picture : "");
        } catch (IllegalArgumentException | ClassCastException exception) {
            throw invalidToken();
        }
    }

    private BadCredentialsException invalidToken() {
        return new BadCredentialsException("Không thể xác minh tài khoản Google. Vui lòng đăng nhập lại.");
    }

    public record GoogleIdentity(String subject, String email, String fullName, String avatarUrl) { }
}
