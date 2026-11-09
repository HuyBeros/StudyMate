package com.huyberos.studymate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @Size(max = 100) String currentPassword,
        @NotBlank @Size(min = 8, max = 72)
        @Pattern(regexp = "(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]+",
                 message = "Mật khẩu cần ít nhất một chữ hoa, một chữ số và một ký tự đặc biệt (@$!%*?&).")
        String newPassword) {}
