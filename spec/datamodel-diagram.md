# Data model diagram

Source of truth for the diagram required by
[SPEC-datamodel-diagram.md](SPEC-datamodel-diagram.md): the tables of the
schema `avarc`, as the Flyway migrations in
`avarc-server-backend/src/main/resources/db/migration` create them. The
logical model is in [SPEC-locations.md](SPEC-locations.md) and
[SPEC-users.md](SPEC-users.md). `GENERATED` marks a column the database
computes; the application does not touch it. Current up to migration
`V4__location_legacy.sql`.

```mermaid
erDiagram
    app_user {
        uuid id PK
        text kc_subject UK "Keycloak subject"
        text kc_username
        text kc_email
        text kc_first_name
        text kc_last_name
        text kc_display_name
        jsonb preferences
        timestamptz created_at
        timestamptz last_login_at
    }

    location {
        uuid id PK
        text position_kind "only point so far"
        double latitude
        double longitude
        geography position "GENERATED from latitude, longitude"
        int confidence_level "1-5"
        timestamptz period_start
        timestamptz period_end
        timestamptz created_at
        timestamptz updated_at
        text created_by "Keycloak subject"
        text updated_by "Keycloak subject"
    }

    location_translation {
        uuid location_id PK, FK
        text language PK
        text name
        text description
        text period_label
        int confidence_level "1-5"
    }

    location_reference {
        uuid location_id PK, FK
        int ordinal PK
        text url
        jsonb citations "language to text"
    }

    tag {
        text key PK
        jsonb labels "language to text"
    }

    location_tag {
        uuid location_id PK, FK
        text tag_key PK, FK
    }

    location_legacy {
        int legacy_id PK "id of the place in the legacy schema"
        uuid location_id UK, FK
    }

    location ||--o| location_legacy : "imported from"
    location ||--|{ location_translation : "has"
    location ||--o{ location_reference : "cites"
    location ||--o{ location_tag : "carries"
    tag ||--o{ location_tag : "used by"
```

`location.created_by`, `location.updated_by` and `app_user.kc_subject` hold the
same Keycloak subject but are not linked by a foreign key.
