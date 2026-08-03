package com.huyberos.studymate.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OAuthLoginRequest {

    @NotBlank(message = "Provider is required (GOOGLE, FACEBOOK)")
    private String provider;

    private String token;

    @NotBlank(message = "Email is required")
    private String email;

    private String fullName;
    private String avatarUrl;
}
