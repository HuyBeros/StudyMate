package com.huyberos.studymate.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @Pattern(regexp = "[A-Za-z0-9_][A-Za-z0-9_.-]{2,31}", message = "Tên người dùng phải có 3–32 ký tự, gồm chữ không dấu, số, dấu gạch dưới, chấm hoặc gạch ngang.")
    private String username;

    @Email(message = "Invalid email format")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Mật khẩu phải có từ 8 đến 72 ký tự.")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
            message = "Mật khẩu cần ít nhất 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt (@$!%*?&)."
    )
    private String password;

    @Size(max = 255)
    private String fullName;

    @AssertTrue(message = "Hãy nhập tên người dùng hoặc email.")
    public boolean isRegistrationIdentityValid() {
        return username != null ? email == null : email != null && !email.isBlank();
    }
}
