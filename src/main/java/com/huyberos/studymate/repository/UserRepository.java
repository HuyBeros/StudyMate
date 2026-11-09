package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.entity.enums.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Locale;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select u from User u where u.id = :id")
    Optional<User> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);


    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);

    default Optional<User> findByLogin(String identifier) {
        String login = identifier.trim();
        return login.contains("@") ? findByEmail(login) : findByUsername(login.toLowerCase(Locale.ROOT));
    }

    // Dùng cho OAuth2 login: tìm user theo provider + provider_id
    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);
}
