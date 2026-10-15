# SPEC: Users

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define the application's own record of a person, so that data of the
application, starting with preferences, can be attached to them.

## Requirements

- Keycloak stays the owner of accounts, credentials and roles
  ([SPEC-auth.md](SPEC-auth.md)); the application keeps a `User` for what
  Keycloak does not hold.
- A `User` is created at the first successful login and found again at every
  later one.
- A user reads their own record and changes their own preferences, nobody
  else's.

## Data model

The tables are in the [data model diagram](datamodel-diagram.md).

**User**

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Assigned by the system, never reused. |
| `subject` | text | The `sub` claim of the realm, unique. It is the only link to Keycloak; users are never matched by email or name, which can change. |
| `username`, `email`, `first_name`, `last_name`, `display_name` | text | Imported from Keycloak, see below. Optional, as the token may lack a claim. |
| `preferences` | JSON object | Owned by the application, see below. Defaults to `{}`. |
| `created_at`, `last_login_at` | timestamp (UTC) | Set by the system. |

## Decisions

- **Backend module:** `user` ([SPEC-backend.md](SPEC-backend.md)). The login
  in `auth` announces itself as an application event, a type in the API of
  `auth`, and `user` listens to it; `auth` has no reference to `user`.
- **Creation:** the first login finds no user for the `subject` and creates
  one. The creation is idempotent: two simultaneous first logins end with one
  user (unique constraint, then a read), never with an error for the person.
- **Imported properties:** the profile claims of the ID token (`preferred_username`,
  `email`, `given_name`, `family_name`, `name`) are copied at every login, so
  they follow changes made in Keycloak. Keycloak is the source of truth: the
  application never edits them and the API offers no way to change them. The
  stored copy is personal data: only claims that a feature uses are imported,
  so a claim is dropped from the list when nothing uses it. Roles are not
  copied; they stay in the token.
- **Failure at login:** a failure to store the user is logged and does not
  block the login. The user is then created or refreshed at the next login,
  and `GET /api/users/me` creates a missing user on demand.
- **Preferences:** stored as one JSON object, so a preference is added
  without a schema change. The first is `appearance`: `light`, `dark` or
  `system` (default, follow the browser). Unknown keys and invalid values are
  rejected. Applying the appearance is a task of the frontend. The language
  is not stored until a feature needs it.
- **API:** under `/api/users/`, in the OpenAPI document.
  - `GET /api/users/me` answers the record of the logged-in user: `id`,
    `username`, `email`, `firstName`, `lastName`, `displayName`,
    `preferences`, without `subject`.
  - `PATCH /api/users/me` takes `{"preferences": {...}}`, merges the given
    keys into the stored preferences and answers the record. It requires the
    CSRF token.
  - There is no endpoint by id and none that lists users. `GET /api/auth/me`
    keeps its meaning.
- **Deleted accounts:** an account deleted in Keycloak leaves its user
  record behind and nothing removes it. The `subject` is never reused, so
  `created_by` and `updated_by` of locations
  ([SPEC-locations.md](SPEC-locations.md)) keep their meaning. Removing the
  personal data of deleted accounts is added when a feature needs it.
