package com.huyberos.studymate.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserProfileRequest {

    @Size(max = 255, message = "Full name must not exceed 255 characters")
    private String fullName;

    @Size(max = 500, message = "Avatar URL must not exceed 500 characters")
    private String avatarUrl;

}
