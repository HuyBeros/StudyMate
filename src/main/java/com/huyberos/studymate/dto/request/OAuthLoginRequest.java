package com.huyberos.studymate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OAuthLoginRequest {

    @NotBlank(message = "Provider is required")
    @Pattern(regexp = "GOOGLE", message = "Chỉ hỗ trợ xác thực Google đã được xác minh.")
    private String provider;

    @NotBlank(message = "Google ID token is required")
    @Size(max = 16384)
    private String token;

    // Compatibility fields are ignored for authentication. Identity comes from the verified token.
    private String email;

    private String fullName;
    private String avatarUrl;
}
