CREATE TABLE avarc.app_user (
    id            uuid PRIMARY KEY,
    subject       text        NOT NULL UNIQUE,
    username      text,
    email         text,
    first_name    text,
    last_name     text,
    display_name  text,
    preferences   jsonb       NOT NULL DEFAULT '{}',
    created_at    timestamptz NOT NULL,
    last_login_at timestamptz NOT NULL
);
