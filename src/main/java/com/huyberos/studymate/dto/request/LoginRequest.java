package com.huyberos.studymate.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

    @Size(max = 32)
    private String username;

    @Email(message = "Invalid email format")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @AssertTrue(message = "Hãy nhập tên người dùng hoặc email.")
    public boolean isLoginIdentityValid() {
        return username != null ? email == null && !username.isBlank() && !username.contains("@")
                : email != null && !email.isBlank();
    }

    public String loginIdentifier() {
        return username != null ? username : email;
    }
}
