---
id: AVARC-12
type: task
status: in-progress
priority: normal
area: frontend
depends-on: [AVARC-6, AVARC-10]
created: 2026-10-11
---

# TASK: Locations UI

Spec: [SPEC-frontend.md](../spec/SPEC-frontend.md)

- Render a map (Leaflet, see the frontend spec) and show locations on it with their descriptions.
- Add forms to create and edit locations for authorized users.
- Show or hide the editing controls based on the role reported by
  `GET /api/auth/me` (carried over from
  [AVARC-20](finished/TASK-keycloak-integration.md)).

## Plan

Decided with the maintainer: OpenStreetMap standard tiles; read-only pages
first, then the forms; the position in the form by clicking on the map plus
latitude and longitude fields. Details in
[SPEC-frontend.md](../spec/SPEC-frontend.md).

- [x] Step 1: map and list page, detail page, navigation entry, English and
      German texts, language fallback. Built and rendered against a stand-in
      backend (list, detail, fallback, 404, redirect without a session, both
      languages). Not yet seen in a browser: the Leaflet map itself is drawn
      client-side.
- [x] Step 2: create, edit and delete forms for editors, tag labels for
      admins, controls shown by role. Built and checked against a stand-in
      backend for each role (the controls shown, the guarded pages, the
      prefilled edit form, the tags page) and the request logic of the form
      on its own; not yet used with the real backend in a browser.
