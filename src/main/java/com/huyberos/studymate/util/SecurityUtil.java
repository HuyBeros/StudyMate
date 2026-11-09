package com.huyberos.studymate.util;

import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUtil {

    private final UserRepository userRepository;

    /**
     * Lấy User entity của người đang đăng nhập.
     * Dùng trong bất kỳ Service nào cần biết "user hiện tại là ai".
     */
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResourceNotFoundException("No authenticated user");
        }

        String identifier = ((UserDetails) auth.getPrincipal()).getUsername();
        return userRepository.findByLogin(identifier)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }
}
