INSERT INTO app_user(id,email,full_name) VALUES (1,'migration@example.test','Synthetic migration fixture');
INSERT INTO subject(id,user_id,name) VALUES (1,1,'Synthetic subject');
INSERT INTO task(id,subject_id,user_id,title,status,created_at,completed_at,updated_at,deleted,priority) VALUES
 (1,1,1,'Done','DONE','2026-11-02 23:30','2026-11-03 00:15','2026-11-03 00:15',false,'MEDIUM'),
 (2,1,1,'Deleted done','DONE','2026-11-02 23:30','2026-11-03 00:15','2026-11-03 00:15',true,'MEDIUM'),
 (3,1,1,'Unknown completion','DONE','2026-11-02 23:30',NULL,'2026-11-03 00:15',false,'MEDIUM');
