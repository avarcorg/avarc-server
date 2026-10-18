---
id: AVARC-57
type: task
status: open
priority: low
area: frontend
depends-on: [AVARC-56]
created: 2026-10-18
---

# TASK: Avatar of a user: pages

Spec: [SPEC-users.md](../spec/SPEC-users.md) ("Avatar"),
[SPEC-frontend.md](../spec/SPEC-frontend.md)

The pages for the avatar of [AVARC-56](TASK-avatar-backend.md): the avatar in
the header and a place to change it.

## To do

- Show the avatar in the header next to the name, with the initials as the
  fallback; load it with `updatedAt` in the address, so a change shows at once.
- A place for the user to upload a file (with a preview of the cut), to fetch
  the Gravatar, and to remove the avatar; the texts of the errors of the API
  in the user's language. All fixed texts go to `messages/en.json`.
- A note next to the Gravatar button that the address is sent to Gravatar once,
  and what is stored.
- Keyboard and screen reader use of the controls, alt text for the image.

## Verification

A user uploads a picture and sees it in the header after the reload; fetches
a Gravatar and sees it replace the picture; removes it and sees the initials;
a refused file shows the message, not a raw error.
