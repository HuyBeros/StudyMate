-- =====================================================
-- Migration: Thêm bảng async_jobs cho hệ thống AI Async Job
-- Chạy thủ công: psql -U postgres -d studymate -f migration_002_add_async_jobs.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS async_jobs (
    job_id       VARCHAR(64)  NOT NULL PRIMARY KEY,
    user_id      BIGINT,
    job_type     VARCHAR(50)  NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    result_json  TEXT,
    error_message TEXT,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP
);

-- Index để tìm nhanh job theo user
CREATE INDEX IF NOT EXISTS idx_async_jobs_user_id ON async_jobs(user_id);

-- Index để tìm nhanh theo trạng thái (PENDING, PROCESSING, v.v.)
CREATE INDEX IF NOT EXISTS idx_async_jobs_status ON async_jobs(status);
