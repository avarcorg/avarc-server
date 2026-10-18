---
id: AVARC-59
type: task
status: open
priority: low
area: frontend
depends-on: [AVARC-42]
created: 2026-10-18
---

# TASK: User profile page

Spec: [SPEC-users.md](../spec/SPEC-users.md),
[SPEC-frontend.md](../spec/SPEC-frontend.md)

One page for the logged-in user's own profile and preferences, reached from the
user menu of the top bar. It is the home of the settings that
[AVARC-51](TASK-home-location.md) (home location) and
[AVARC-57](TASK-avatar-frontend.md) (avatar, with the backend
[AVARC-56](TASK-avatar-backend.md)) add, so those two depend on this item and
are built into it, not as pages of their own. Low priority.

## To do

- Specify the page in `SPEC-frontend.md` before building it: the address, the
  entry in the user menu, the sections and how a later setting adds one.
- The page `/<language>/profile`, behind a login like the other pages, with the
  frame of the site. A section for each kind of content, so a setting is added
  without reshaping the page.
- The first section shows the imported properties (name, email, username)
  read-only, with a note that they are managed in the identity provider
  ([SPEC-users.md](../spec/SPEC-users.md), "Imported properties"), and the
  roles.
- A section for the preference `appearance` (light, dark, system), which the
  backend already stores; applying it to the pages belongs here too.
- All fixed texts in `messages/en.json`; keyboard and screen reader use.

## Verification

A logged-in user opens the page from the user menu and sees their properties
and roles, changes the appearance and sees it applied after a reload; a visitor
without a login is sent to the login page; AVARC-51 and AVARC-57 add their
sections without changing the structure of the page.
