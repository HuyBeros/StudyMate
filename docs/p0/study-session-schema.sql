-- P0 REVIEW DRAFT — not a runtime migration and NOT applied by this change.
-- Review legacy timestamp timezone, existing constraints and backup/restore before promoting to migration_003.
-- Existing Java entities keep their sequence primary keys. UUIDs below identify offline-created records.
BEGIN;

CREATE SEQUENCE study_preferences_id_seq START WITH 1 INCREMENT BY 1;
CREATE TABLE user_study_preferences (
    id BIGINT PRIMARY KEY DEFAULT nextval('study_preferences_id_seq'),
    user_id BIGINT NOT NULL UNIQUE REFERENCES app_user(id),
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    school VARCHAR(160),
    major VARCHAR(160),
    weekly_goal_seconds INTEGER NOT NULL DEFAULT 21600 CHECK (weekly_goal_seconds BETWEEN 1800 AND 604800),
    reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_local_time TIME NOT NULL DEFAULT '19:00',
    version BIGINT NOT NULL DEFAULT 0 CHECK (version >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE study_session_id_seq START WITH 1 INCREMENT BY 1;
CREATE TABLE study_session (
    id BIGINT PRIMARY KEY DEFAULT nextval('study_session_id_seq'),
    public_id UUID NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES app_user(id),
    device_id UUID NOT NULL,
    task_id BIGINT REFERENCES task(id) ON DELETE SET NULL,
    subject_id BIGINT REFERENCES subject(id) ON DELETE SET NULL,
    subject_name_snapshot VARCHAR(255),
    status VARCHAR(20) NOT NULL CHECK (status IN ('RUNNING','PAUSED','COMPLETED','STOPPED','DISCARDED','CONFLICT')),
    provenance VARCHAR(24) NOT NULL DEFAULT 'TRACKED' CHECK (provenance IN ('TRACKED','LEGACY_DURATION')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    legacy_duration_seconds INTEGER CHECK (legacy_duration_seconds > 0),
    version BIGINT NOT NULL DEFAULT 0 CHECK (version >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CHECK (ended_at IS NULL OR (started_at IS NOT NULL AND ended_at > started_at)),
    CHECK (provenance <> 'TRACKED' OR legacy_duration_seconds IS NULL)
);
CREATE INDEX idx_study_session_user_time ON study_session(user_id, started_at);

CREATE SEQUENCE study_segment_id_seq START WITH 1 INCREMENT BY 1;
CREATE TABLE study_session_segment (
    id BIGINT PRIMARY KEY DEFAULT nextval('study_segment_id_seq'),
    public_id UUID NOT NULL UNIQUE,
    session_id BIGINT NOT NULL REFERENCES study_session(id),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    CHECK (ended_at IS NULL OR ended_at > started_at)
);
CREATE INDEX idx_study_segment_session ON study_session_segment(session_id);
-- Backend checks ownership, bounded duration, legal transitions and overlap in a transaction.
-- Never accept user_id or a pre-computed total duration as authorization/proof from a request.

CREATE SEQUENCE study_completion_id_seq START WITH 1 INCREMENT BY 1;
CREATE TABLE task_completion_event (
    id BIGINT PRIMARY KEY DEFAULT nextval('study_completion_id_seq'),
    public_id UUID NOT NULL UNIQUE,
    user_id BIGINT NOT NULL REFERENCES app_user(id),
    task_public_id UUID NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    timezone_at_event VARCHAR(64) NOT NULL,
    revoked_at TIMESTAMPTZ,
    source_mutation_id UUID NOT NULL,
    UNIQUE(user_id, source_mutation_id)
);
-- Historical evidence is independent from the task FK, so task deletion does not erase actual work.

CREATE SEQUENCE sync_user_state_id_seq START WITH 1 INCREMENT BY 1;
CREATE TABLE sync_user_state (
    id BIGINT PRIMARY KEY DEFAULT nextval('sync_user_state_id_seq'),
    user_id BIGINT NOT NULL UNIQUE REFERENCES app_user(id),
    revision BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0)
);
CREATE SEQUENCE sync_receipt_id_seq START WITH 1 INCREMENT BY 1;
CREATE TABLE sync_mutation_receipt (
    id BIGINT PRIMARY KEY DEFAULT nextval('sync_receipt_id_seq'),
    user_id BIGINT NOT NULL REFERENCES app_user(id),
    mutation_id UUID NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    response_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, mutation_id)
);
CREATE SEQUENCE sync_change_id_seq START WITH 1 INCREMENT BY 1;
CREATE TABLE sync_change (
    id BIGINT PRIMARY KEY DEFAULT nextval('sync_change_id_seq'),
    user_id BIGINT NOT NULL REFERENCES app_user(id),
    revision BIGINT NOT NULL,
    entity_type VARCHAR(40) NOT NULL,
    entity_public_id UUID NOT NULL,
    operation VARCHAR(12) NOT NULL CHECK (operation IN ('UPSERT','DELETE')),
    payload_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, revision)
);
-- SELECT ... FOR UPDATE on sync_user_state, increment revision and write entity/receipt/change/outbox
-- in ONE transaction. Global sequence IDs alone are not a safe committed change cursor.

CREATE SEQUENCE study_outbox_id_seq START WITH 1 INCREMENT BY 1;
CREATE TABLE study_outbox (
    id BIGINT PRIMARY KEY DEFAULT nextval('study_outbox_id_seq'),
    user_id BIGINT NOT NULL REFERENCES app_user(id),
    revision BIGINT NOT NULL,
    kind VARCHAR(40) NOT NULL,
    payload_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMPTZ,
    UNIQUE(user_id, revision, kind)
);

-- Existing Task needs staged public_id/version/deleted_at migration in P1:
-- add nullable UUID, backfill once, build unique index, make NOT NULL, then switch writers.
-- Do not rewrite legacy due_at/completed_at to UTC without establishing their source timezone.
COMMIT;
