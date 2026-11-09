package com.huyberos.studymate.study;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskCompletionEventRepository extends JpaRepository<TaskCompletionEvent, Long> {
    List<TaskCompletionEvent> findByUserId(Long userId);
    Optional<TaskCompletionEvent> findByUserIdAndTaskPublicIdAndRevokedAtIsNull(Long userId, UUID taskPublicId);
}
