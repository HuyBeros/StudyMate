-- P1: additive schema, transactional. Run AFTER setting studymate.legacy_timezone explicitly.
-- Example: SET studymate.legacy_timezone = 'Asia/Ho_Chi_Minh'; then run this file on that connection.
BEGIN;
DO $$ BEGIN
    IF current_setting('studymate.legacy_timezone', true) IS NULL THEN
        RAISE EXCEPTION 'Set studymate.legacy_timezone to the timezone used by existing task timestamps before migration';
    END IF;
    PERFORM now() AT TIME ZONE current_setting('studymate.legacy_timezone');
END $$;

ALTER TABLE task ADD COLUMN IF NOT EXISTS public_id UUID;
-- The API already permits tasks without a subject (free study).
ALTER TABLE task ALTER COLUMN subject_id DROP NOT NULL;
UPDATE task SET public_id = gen_random_uuid() WHERE public_id IS NULL;
ALTER TABLE task ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_public_id ON task(public_id);
-- Preserve legacy timestamps; add an unambiguous instant for period filtering.
ALTER TABLE task ADD COLUMN IF NOT EXISTS created_at_instant TIMESTAMPTZ;
UPDATE task SET created_at_instant = created_at AT TIME ZONE current_setting('studymate.legacy_timezone') WHERE created_at_instant IS NULL;
ALTER TABLE task ALTER COLUMN created_at_instant SET NOT NULL;

CREATE SEQUENCE IF NOT EXISTS study_preferences_id_seq INCREMENT BY 1;
CREATE TABLE IF NOT EXISTS user_study_preferences (
    id BIGINT PRIMARY KEY DEFAULT nextval('study_preferences_id_seq'),
    user_id BIGINT NOT NULL UNIQUE REFERENCES app_user(id),
    timezone VARCHAR(64) NOT NULL,
    school VARCHAR(160) NOT NULL DEFAULT '', major VARCHAR(160) NOT NULL DEFAULT '',
    weekly_goal_seconds INTEGER NOT NULL DEFAULT 21600 CHECK (weekly_goal_seconds BETWEEN 1800 AND 604800),
    reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_local_time TIME NOT NULL DEFAULT '19:00',
    version BIGINT NOT NULL DEFAULT 0,
    legacy_imported_at TIMESTAMPTZ,
    preferences_written_at TIMESTAMPTZ
);
INSERT INTO user_study_preferences(user_id, timezone)
SELECT id, current_setting('studymate.legacy_timezone') FROM app_user
ON CONFLICT (user_id) DO NOTHING;
ALTER TABLE user_study_preferences ADD COLUMN IF NOT EXISTS preferences_written_at TIMESTAMPTZ;

CREATE SEQUENCE IF NOT EXISTS study_account_state_id_seq INCREMENT BY 1;
CREATE TABLE IF NOT EXISTS study_account_state (
    id BIGINT PRIMARY KEY DEFAULT nextval('study_account_state_id_seq'),
    user_id BIGINT NOT NULL UNIQUE REFERENCES app_user(id),
    revision BIGINT NOT NULL DEFAULT 0
);
INSERT INTO study_account_state(user_id) SELECT id FROM app_user ON CONFLICT (user_id) DO NOTHING;

CREATE SEQUENCE IF NOT EXISTS study_session_id_seq INCREMENT BY 1;
CREATE TABLE IF NOT EXISTS study_session (
    id BIGINT PRIMARY KEY DEFAULT nextval('study_session_id_seq'),
    public_id UUID NOT NULL, user_id BIGINT NOT NULL REFERENCES app_user(id), device_id UUID NOT NULL,
    task_id BIGINT, task_public_id UUID, task_title VARCHAR(255),
    subject_id BIGINT, subject_name VARCHAR(255),
    status VARCHAR(20) NOT NULL CHECK (status IN ('RUNNING','PAUSED','COMPLETED','STOPPED','DISCARDED')),
    target_seconds INTEGER NOT NULL CHECK (target_seconds BETWEEN 60 AND 14400),
    provenance VARCHAR(24) NOT NULL CHECK (provenance IN ('TRACKED','LEGACY_DURATION')),
    started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ,
    legacy_duration_seconds INTEGER CHECK (legacy_duration_seconds BETWEEN 1 AND 14400),
    legacy_hash VARCHAR(64), version BIGINT NOT NULL DEFAULT 0,
    UNIQUE(user_id, public_id),
    CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);
CREATE INDEX IF NOT EXISTS idx_study_session_user ON study_session(user_id, ended_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_study_session_one_active ON study_session(user_id)
    WHERE status IN ('RUNNING','PAUSED');
-- task/subject fields are immutable historical snapshots, intentionally not cascading foreign keys.

CREATE SEQUENCE IF NOT EXISTS study_segment_id_seq INCREMENT BY 1;
CREATE TABLE IF NOT EXISTS study_session_segment (
    id BIGINT PRIMARY KEY DEFAULT nextval('study_segment_id_seq'),
    session_id BIGINT NOT NULL REFERENCES study_session(id),
    started_at TIMESTAMPTZ NOT NULL, ended_at TIMESTAMPTZ,
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);
CREATE INDEX IF NOT EXISTS idx_study_segment_session ON study_session_segment(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_study_segment_one_open ON study_session_segment(session_id) WHERE ended_at IS NULL;

CREATE SEQUENCE IF NOT EXISTS study_completion_id_seq INCREMENT BY 1;
CREATE TABLE IF NOT EXISTS task_completion_event (
    id BIGINT PRIMARY KEY DEFAULT nextval('study_completion_id_seq'),
    public_id UUID NOT NULL UNIQUE, user_id BIGINT NOT NULL REFERENCES app_user(id),
    task_public_id UUID NOT NULL, subject_id BIGINT,
    completed_at TIMESTAMPTZ NOT NULL, revoked_at TIMESTAMPTZ,
    timezone_at_event VARCHAR(64) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_study_completion_user ON task_completion_event(user_id, completed_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_study_completion_active_task ON task_completion_event(user_id, task_public_id) WHERE revoked_at IS NULL;
INSERT INTO task_completion_event(public_id, user_id, task_public_id, subject_id, completed_at, timezone_at_event)
SELECT gen_random_uuid(), t.user_id, t.public_id, t.subject_id,
       t.completed_at AT TIME ZONE current_setting('studymate.legacy_timezone'), current_setting('studymate.legacy_timezone')
FROM task t WHERE t.status = 'DONE' AND t.completed_at IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM task_completion_event e WHERE e.user_id=t.user_id AND e.task_public_id=t.public_id);

CREATE SEQUENCE IF NOT EXISTS study_receipt_id_seq INCREMENT BY 1;
CREATE TABLE IF NOT EXISTS study_mutation_receipt (
    id BIGINT PRIMARY KEY DEFAULT nextval('study_receipt_id_seq'),
    user_id BIGINT NOT NULL REFERENCES app_user(id), mutation_id UUID NOT NULL,
    operation VARCHAR(80) NOT NULL, request_hash VARCHAR(64) NOT NULL,
    response_json JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL,
    UNIQUE(user_id, mutation_id)
);
COMMIT;
