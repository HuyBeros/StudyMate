CREATE TYPE auth_provider AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');

ALTER TABLE app_user ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE app_user ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS provider auth_provider NOT NULL DEFAULT 'LOCAL';
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_provider ON app_user(provider, provider_id) WHERE provider_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON refresh_token(user_id);
