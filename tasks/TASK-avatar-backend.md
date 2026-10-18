---
id: AVARC-56
type: task
status: open
priority: low
area: backend
depends-on: [AVARC-42]
created: 2026-10-18
---

# TASK: Avatar of a user: backend

Spec: [SPEC-users.md](../spec/SPEC-users.md) ("Avatar", "Avatar API")

A user can upload a picture or fetch their Gravatar once, and the application
keeps it in the database. This item is the backend: migration, processing and
the API; the pages are [AVARC-57](TASK-avatar-frontend.md).

## To do

- A Flyway migration for the table of the avatar, and the data model diagram
  (`spec/datamodel-diagram.md`) in the same change.
- The image processing: decode with the JDK's own readers, refuse other types
  and oversized files and pixel counts, cut the centred square, scale to
  256 x 256, store as PNG.
- The four calls of the avatar API and the `avatar` field of `GET
  /api/users/me`; the Gravatar fetch with its fixed host, timeout and size
  limit, and the errors of the spec.
- Tests: the processing (a JPEG with metadata, a transparent PNG, a bomb of
  pixels, a renamed non-image), the API (CSRF, 400, 413, 404, replace and
  remove) and the Gravatar fetch against a stand-in server, never the real one.
- Check that the legacy import and the backup tests do not break.

## Verification

An uploaded JPEG comes back from `GET` as a 256 x 256 PNG without metadata;
the Gravatar of a known address is stored as a copy and a second request
replaces it; a file that is not an image, or too large, is refused; the
avatar of one user is never served to another.
