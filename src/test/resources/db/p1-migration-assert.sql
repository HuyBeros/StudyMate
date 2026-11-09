DO $$ BEGIN
 IF (SELECT count(*) FROM task) <> 3 THEN RAISE EXCEPTION 'Migration lost tasks'; END IF;
 IF (SELECT count(DISTINCT public_id) FROM task) <> 3 THEN RAISE EXCEPTION 'Public IDs are missing/duplicated'; END IF;
 IF (SELECT count(*) FROM task_completion_event) <> 2 THEN RAISE EXCEPTION 'Backfill duplicated events or invented a missing completion'; END IF;
 IF (SELECT count(*) FROM task_completion_event WHERE revoked_at IS NOT NULL) <> 1 THEN RAISE EXCEPTION 'Rerun did not preserve revoked history'; END IF;
 IF EXISTS (SELECT 1 FROM task WHERE created_at <> TIMESTAMP '2026-11-02 23:30') THEN RAISE EXCEPTION 'Rewrote old timestamps'; END IF;
 IF EXISTS (SELECT 1 FROM task WHERE created_at_instant <> TIMESTAMPTZ '2026-11-02 16:30Z') THEN RAISE EXCEPTION 'Wrong canonical creation timezone'; END IF;
 IF EXISTS (SELECT 1 FROM task_completion_event WHERE completed_at <> TIMESTAMPTZ '2026-11-02 17:15Z') THEN RAISE EXCEPTION 'Wrong completion timezone'; END IF;
 IF (SELECT count(*) FROM user_study_preferences WHERE timezone='Asia/Ho_Chi_Minh') <> 1 THEN RAISE EXCEPTION 'Incorrect account preferences'; END IF;
END $$;
