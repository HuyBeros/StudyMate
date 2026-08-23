package com.huyberos.studymate.repository;

import com.huyberos.studymate.entity.AsyncJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AsyncJobRepository extends JpaRepository<AsyncJob, String> {

    Optional<AsyncJob> findByJobIdAndUserId(String jobId, Long userId);

    Optional<AsyncJob> findByJobId(String jobId);
}
