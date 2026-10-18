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
| `kc_subject` | text | The `sub` claim of the realm, unique. It is the only link to Keycloak; users are never matched by email or name, which can change. |
| `kc_username`, `kc_email`, `kc_first_name`, `kc_last_name`, `kc_display_name` | text | Imported from Keycloak, see below. Optional, as the token may lack a claim. |
| `preferences` | JSON object | Owned by the application, see below. Defaults to `{}`. |
| `created_at`, `last_login_at` | timestamp (UTC) | Set by the system. |

**Avatar** (at most one per user, see "Avatar" below)

| Field | Type | Notes |
|-------|------|-------|
| `user_id` | UUID | The user, primary key. The row goes with the user. |
| `source` | text | `upload` or `gravatar`. |
| `content_type` | text | Always `image/png`. |
| `data` | bytea | The image after processing, 256 x 256 pixels. |
| `updated_at` | timestamp (UTC) | Set by the system at every change. |

## Decisions

- **Column names:** the columns that hold what is fetched from Keycloak carry
  the prefix `kc_`, so they are told apart from the application's own
  columns; the API shows them without it (`username`, `email`, ...). They
  were renamed from the plain names by migration `V3`.
- **Backend module:** `user` ([SPEC-backend.md](SPEC-backend.md)). The login
  in `auth` announces itself as an application event, a type in the API of
  `auth`, and `user` listens to it; `auth` has no reference to `user`.
- **Creation:** the first login finds no user for the `kc_subject` and creates
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
    `preferences`, without the subject.
  - `PATCH /api/users/me` takes `{"preferences": {...}}`, merges the given
    keys into the stored preferences and answers the record. It requires the
    CSRF token.
  - There is no endpoint by id and none that lists users. `GET /api/auth/me`
    keeps its meaning.
- **Avatar:** a user has one image, shown instead of their initials. It is
  set in one of two ways, both stored the same way, in the database next to
  the user (a table of its own, so reading the user does not read the image;
  the nightly dumps and the restore cover it):
  - *Upload:* a PNG or JPEG of at most 2 MB and 4096 x 4096 pixels. The
    backend decodes it itself and does not trust the declared type (SVG, GIF
    and everything else are refused), cuts the largest centred square, scales
    it to 256 x 256 and stores it as PNG, which drops metadata such as
    location and camera data.
  - *Gravatar:* on the user's request only, the backend fetches the Gravatar
    of the user's email address once (`https://gravatar.com/avatar/<SHA-256 of
    the trimmed, lower-case email>`, size 256, "no default image"; a fixed
    host, a timeout of five seconds, at most 1 MB, redirects only within the
    host) and stores it through the same processing as an upload, as a copy.
    Browsers never contact Gravatar, and nothing is sent without that request.
    The copy does not follow later changes at Gravatar until the user asks
    again. An address without a Gravatar, or a user without an email, is
    answered with an error that says so.
  A new avatar replaces the old one; the user can remove theirs. Avatars are
  personal data: they are part of the privacy statement
  ([AVARC-9](../tasks/TASK-licensing-decision.md)), which names Gravatar as
  the one third party contacted, and only on request.
- **Avatar API:** under `/api/users/me/avatar`, in the OpenAPI document; the
  writing calls require the CSRF token.
  - `GET` answers the image (`image/png`, `X-Content-Type-Options: nosniff`,
    an `ETag` and `Cache-Control: private`), or 404 without an avatar.
  - `PUT` takes the file as `multipart/form-data` (part `file`) and answers
    the record of the user; 400 for a file that is not an accepted image,
    413 for one that is too large.
  - `POST /gravatar` fetches the Gravatar as above and answers the record;
    404 when the address has none, 409 for a user without an email, 502 when
    Gravatar does not answer.
  - `DELETE` removes the avatar.
  - `GET /api/users/me` gains `avatar`: `null` or `{"source": ..., "updatedAt":
    ...}`, so the frontend can build the address with `updatedAt` as the
    cache-busting value. There is still no endpoint by id: an avatar is shown
    to its own user only, until a feature shows other users (for example the
    editor of a location), which then specifies who may see it.
- **Deleted accounts:** an account deleted in Keycloak leaves its user
  record behind and nothing removes it. The `kc_subject` is never reused, so
  `created_by` and `updated_by` of locations
  ([SPEC-locations.md](SPEC-locations.md)) keep their meaning. Removing the
  personal data of deleted accounts is added when a feature needs it.
