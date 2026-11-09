BEGIN;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS username varchar(32);
ALTER TABLE app_user ALTER COLUMN email DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_user_username ON app_user (username);
COMMIT;
