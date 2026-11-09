package com.huyberos.studymate.controller;

import com.huyberos.studymate.exception.ServiceUnavailableException;
import com.huyberos.studymate.security.GoogleIdentityVerifier;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;

class P0GoogleIdentityVerifierTest {
    private static RSAKey trustedKey;
    private static RSAKey attackerKey;
    private static GoogleIdentityVerifier verifier;

    @BeforeAll
    static void initialize() throws Exception {
        trustedKey = new RSAKeyGenerator(2048).keyID("google-test").generate();
        attackerKey = new RSAKeyGenerator(2048).keyID("attacker-test").generate();
        verifier = new GoogleIdentityVerifier(NimbusJwtDecoder.withPublicKey(trustedKey.toRSAPublicKey()).build(), "web-client,android-client");
    }

    @Test
    void acceptsSignedGoogleIdentityAndReadsProfileOnlyFromClaims() throws Exception {
        var result = verifier.verify(token(builder -> builder.claim("azp", "android-client")));
        assertEquals("google-sub-123", result.subject());
        assertEquals("verified@example.test", result.email());
        assertEquals("Verified User", result.fullName());
        assertEquals("https://example.test/avatar.png", result.avatarUrl());
    }

    @Test
    void acceptsTheDocumentedBareGoogleIssuer() throws Exception {
        assertEquals("google-sub-123", verifier.verify(token(builder -> builder.issuer("accounts.google.com"))).subject());
    }

    @Test
    void rejectsTamperedSignatureAndUnsignedOrMalformedTokens() throws Exception {
        assertThrows(BadCredentialsException.class, () -> verifier.verify(sign(claims().build(), attackerKey)));
        assertThrows(BadCredentialsException.class, () -> verifier.verify("eyJhbGciOiJub25lIn0.eyJzdWIiOiJ2aWN0aW0ifQ."));
        assertThrows(BadCredentialsException.class, () -> verifier.verify("not-a-token"));
        assertThrows(BadCredentialsException.class, () -> verifier.verify(""));
    }

    @Test
    void rejectsWrongIssuerAudienceAndAuthorizedParty() throws Exception {
        assertRejected(builder -> builder.issuer("https://attacker.example.test"));
        assertRejected(builder -> builder.audience("other-client"));
        assertRejected(builder -> builder.audience((List<String>) null));
        assertRejected(builder -> builder.claim("azp", "other-client"));
        assertRejected(builder -> builder.audience(List.of("web-client", "android-client")));
    }

    @Test
    void rejectsExpiredAndFutureTokens() throws Exception {
        assertRejected(builder -> builder.expirationTime(Date.from(Instant.now().minusSeconds(5))));
        assertRejected(builder -> builder.issueTime(Date.from(Instant.now().plusSeconds(120))));
        assertRejected(builder -> builder.notBeforeTime(Date.from(Instant.now().plusSeconds(120))));
        assertRejected(builder -> builder.expirationTime(null));
        assertRejected(builder -> builder.issueTime(null));
    }

    @Test
    void rejectsUnverifiedOrMissingIdentityClaims() throws Exception {
        assertRejected(builder -> builder.claim("email_verified", false));
        assertRejected(builder -> builder.claim("email_verified", null));
        assertRejected(builder -> builder.subject(""));
        assertRejected(builder -> builder.subject(null));
        assertRejected(builder -> builder.claim("email", null));
    }

    @Test
    void failsClosedWhenNoClientIdsAreConfigured() throws Exception {
        var unconfigured = new GoogleIdentityVerifier(NimbusJwtDecoder.withPublicKey(trustedKey.toRSAPublicKey()).build(), " , ");
        assertThrows(ServiceUnavailableException.class, () -> unconfigured.verify(token(builder -> { })));
    }

    private static JWTClaimsSet.Builder claims() {
        return new JWTClaimsSet.Builder().issuer("https://accounts.google.com").audience("web-client")
                .subject("google-sub-123").issueTime(Date.from(Instant.now().minusSeconds(60)))
                .expirationTime(Date.from(Instant.now().plusSeconds(300)))
                .claim("email", "Verified@Example.test").claim("email_verified", true)
                .claim("name", "Verified User").claim("picture", "https://example.test/avatar.png");
    }

    private static String token(Consumer<JWTClaimsSet.Builder> change) throws Exception {
        var builder = claims();
        change.accept(builder);
        return sign(builder.build(), trustedKey);
    }

    private static String sign(JWTClaimsSet claims, RSAKey key) throws Exception {
        var jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(), claims);
        jwt.sign(new RSASSASigner(key));
        return jwt.serialize();
    }

    private static void assertRejected(Consumer<JWTClaimsSet.Builder> change) throws Exception {
        String encoded = token(change);
        assertThrows(BadCredentialsException.class, () -> verifier.verify(encoded));
    }
}
