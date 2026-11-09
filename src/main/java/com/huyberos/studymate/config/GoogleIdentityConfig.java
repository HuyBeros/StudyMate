package com.huyberos.studymate.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

@Configuration
public class GoogleIdentityConfig {
    @Bean("googleIdTokenDecoder")
    public JwtDecoder googleIdTokenDecoder() {
        // Fixed trusted URL; never accept a JWK URL or algorithm from the request.
        // Key retrieval is lazy, so email/password login still starts without network access.
        return NimbusJwtDecoder.withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs").build();
    }
}
