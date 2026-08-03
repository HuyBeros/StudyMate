package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.entity.enums.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // Dùng cho OAuth2 login: tìm user theo provider + provider_id
    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);
}
