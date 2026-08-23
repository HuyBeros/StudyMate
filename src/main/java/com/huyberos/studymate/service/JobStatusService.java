package com.huyberos.studymate.service;

import com.huyberos.studymate.entity.AsyncJob;
import com.huyberos.studymate.entity.enums.JobStatus;
import com.huyberos.studymate.repository.AsyncJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service riêng để cập nhật trạng thái AsyncJob.
 *
 * Lý do tách thành bean riêng:
 * - Các phương thức @Async trong AsyncJobService có @Transactional.
 *   Nếu Gemini ném RuntimeException bên trong try-catch, Spring đánh
 *   dấu transaction là rollback-only. Khi catch block gọi save(FAILED),
 *   lệnh save thực thi nhưng transaction vẫn bị rollback → status FAILED
 *   không được lưu → frontend mãi thấy PENDING.
 *
 * - Bằng cách dùng REQUIRES_NEW ở đây, mỗi lần gọi updateStatus() sẽ
 *   mở transaction MỚI, commit ngay lập tức, độc lập với transaction
 *   của @Async method cha.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobStatusService {

    private final AsyncJobRepository asyncJobRepository;

    /**
     * Cập nhật trạng thái job trong transaction mới (REQUIRES_NEW).
     * Commit ngay lập tức, không phụ thuộc vào transaction cha.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateStatus(String jobId, JobStatus status, String resultJson, String errorMessage) {
        asyncJobRepository.findByJobId(jobId).ifPresent(job -> {
            job.setStatus(status);
            if (resultJson != null) job.setResultJson(resultJson);
            if (errorMessage != null) job.setErrorMessage(errorMessage);
            asyncJobRepository.save(job);
            log.debug("[JobStatus] jobId={} → {}", jobId, status);
        });
    }
}
