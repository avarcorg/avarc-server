---
id: AVARC-20
type: task
status: open
priority: high
area: auth
depends-on: [AVARC-19, AVARC-8, AVARC-3, AVARC-6]
created: 2026-10-11
---

# TASK: Keycloak integration

Spec: [SPEC-auth.md](../spec/SPEC-auth.md)

Implements the decisions of
[AVARC-19](finished/TASK-auth-provider-revisit.md); replaces the superseded
[AVARC-14](finished/TASK-ory-integration.md).

Deployment (does not need the skeletons):

- Add a `keycloak` service and its on-demand `keycloak` database to the
  Compose project, in production mode (development mode only for the
  developer deployment). Add the secrets Keycloak needs to `run.sh`,
  delivered as files like all secrets (see
  [SPEC-deployment.md](../spec/SPEC-deployment.md)).
- Add the realm import file (roles with their composites, default role,
  client, English and German locales, brute-force protection,
  self-registration and password reset disabled, no secrets in it).
- Route `/auth/` in `deploy/Caddyfile` to the realm endpoints and resources
  only, without prefix stripping, replacing the placeholder route; never the admin console, the admin API,
  the `master` realm or the management port. Configure hostname and
  forwarded headers for the public origin.
- Add a provisioning script `deploy/accounts.sh` that creates the admin
  account and optional editor and viewer accounts through Keycloak's admin
  API from the environment's secrets file, guards the source line against
  inherited `xtrace`, and is safe to repeat.
- Verify the version of Keycloak and the options named above against its
  documentation at implementation time.

Application (blocked on [AVARC-3](TASK-backend-skeleton.md) and
[AVARC-6](TASK-frontend-skeleton.md)):

- Backend: validate the access token locally, map the realm roles to
  permissions, answer 401/403; only the health endpoint is public.
- Frontend: OIDC login and logout against Keycloak, and show or hide editing
  controls based on the role reported by the backend.
- Decide the open question of the spec: how browser calls to `/api/` carry
  the token.

Documentation:

- Add an Authentication section to `AGENTS.md` (service, provisioning
  script, how admins reach the admin console over an SSH tunnel) and mention
  the accounts step in `README.md`.
