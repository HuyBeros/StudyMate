package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    // Thu hồi tất cả token của user (khi logout all devices)
    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.user.id = :userId")
    int revokeAllByUserId(@Param("userId") Long userId);

    // Xóa token hết hạn để dọn DB (chạy bằng scheduled job)
    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < :now OR r.revoked = true")
    int deleteExpiredAndRevoked(@Param("now") LocalDateTime now);

    // Đếm số active token của user (giới hạn số device đăng nhập)
    @Query("SELECT COUNT(r) FROM RefreshToken r WHERE r.user.id = :userId AND r.revoked = false AND r.expiresAt > :now")
    long countActiveByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
