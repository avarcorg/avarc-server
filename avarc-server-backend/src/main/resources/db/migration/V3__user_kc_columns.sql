-- The columns fetched from Keycloak carry the prefix kc_.
ALTER TABLE avarc.app_user RENAME COLUMN subject TO kc_subject;
ALTER TABLE avarc.app_user RENAME COLUMN username TO kc_username;
ALTER TABLE avarc.app_user RENAME COLUMN email TO kc_email;
ALTER TABLE avarc.app_user RENAME COLUMN first_name TO kc_first_name;
ALTER TABLE avarc.app_user RENAME COLUMN last_name TO kc_last_name;
ALTER TABLE avarc.app_user RENAME COLUMN display_name TO kc_display_name;
ALTER TABLE avarc.app_user RENAME CONSTRAINT app_user_subject_key TO app_user_kc_subject_key;
