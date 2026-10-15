---
id: AVARC-12
type: task
status: open
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
