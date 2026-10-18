---
id: AVARC-51
type: task
status: open
priority: low
area: frontend
depends-on: [AVARC-12, AVARC-42]
created: 2026-10-16
---

# TASK: Home location preference

Spec: [SPEC-users.md](../spec/SPEC-users.md),
[SPEC-frontend.md](../spec/SPEC-frontend.md)

A user can save a "home location": the point the map centres on and the zoom
level it opens at. Today the map of the locations page always fits all
markers, which is far from useful once the data covers the world and a person
works in one region. The setting is a preference of the user
([AVARC-42](finished/TASK-user-entities.md)), stored with the user's record,
so it follows the person to every browser.

Meant to be worked on together with the avatar
([AVARC-56](TASK-avatar-backend.md), [AVARC-57](TASK-avatar-frontend.md)): both
add to the user's profile and preferences, so the page for them is built once.

## Approach

- **The preference:** a new key `homeLocation` in the preferences of the user
  ([SPEC-users.md](../spec/SPEC-users.md)): an object with `latitude`
  (-90 to 90), `longitude` (-180 to 180) and `zoom` (a whole number within the
  zoom levels of the tiles, 1 to 19). The backend validates it like the
  existing preference and rejects unknown keys inside it; the object is
  replaced as a whole, not merged field by field. Decide how a user removes
  it (a `null` value that deletes the key, or a reset call) and record it in
  the spec.
- **Using it:** when the preference is set, the map of the locations page opens
  at the home centre and zoom, instead of fitting all markers; without it the
  behaviour stays as it is. The page reads the preference on the server with
  the session cookie, like the user record, so there is no flash of the wrong
  view. Decide whether the position picker of the forms
  ([AVARC-12](finished/TASK-locations-ui.md)) also starts there while a
  location has no position yet (likely yes).
- **Setting it:** a control on the map, "Use this view as my home" (the
  current centre and zoom of the map), and one to reset it. Both send
  `PATCH /api/users/me` from the browser with the session cookie and the CSRF
  token, like the forms; all logged-in users may do it, as it concerns only
  their own record. The result is confirmed on the page, and a failure shows
  the message of the backend.
- **Texts:** the new labels and messages go into the translation files, English
  and German.

## Remaining

- Specify the preference in `SPEC-users.md` (the key, its ranges, how it is
  removed) and the behaviour of the map in `SPEC-frontend.md`.
- Extend the validation of the preferences in the `user` module, with tests:
  valid, out-of-range, missing field, wrong type, unknown key inside, and that
  another preference in the same request is not lost.
- Build the controls and the use of the preference on the locations page.
- A home location is personal data of the user (where the person works). It
  stays in the record, which is already in the database backups
  ([AVARC-48](finished/TASK-database-backup.md)); check that nothing exposes it to
  others (there is no call by user id) and mention it in the spec.
- Check it once in a browser by hand, and add it to the browser tests
  ([AVARC-49](TASK-browser-tests.md)) when those exist.

## Verification

A user sets the current view as home, reloads the page and in another browser,
and the map opens there; resetting brings back the fit-to-markers view; a
second user is not affected; an out-of-range value sent to the API is
rejected with a message and changes nothing.
