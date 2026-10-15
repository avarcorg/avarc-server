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
- Add provisioning scripts, `deploy/create-admin-user.sh` for the admin
  account and `deploy/create-user.sh` for further editors and admins,
  through Keycloak's admin API from the environment's secrets file; they
  guard the source line against inherited `xtrace` and are safe to repeat.
- Verify the version of Keycloak and the options named above against its
  documentation at implementation time.

Application (blocked on [AVARC-3](finished/TASK-backend-skeleton.md) and
[AVARC-6](finished/TASK-frontend-skeleton.md)):

- Backend: login and logout as the OIDC client, with a session
  ([AVARC-29](finished/TASK-backend-login.md)); map the realm roles to
  authorities (done, `ROLE_<role>`, reported by `GET /api/auth/me`), enforce
  them per endpoint and answer 401/403 (open, waits for the endpoints of
  [AVARC-10](TASK-locations-crud-api.md)); only the health endpoint and the login endpoints are
  public. Validating bearer tokens of API clients is left to the task that
  needs it.
- Frontend: login and logout pages
  ([AVARC-30](finished/TASK-frontend-login.md)), and showing or hiding editing
  controls based on the role reported by the backend.
- The open question of the spec, how browser calls to `/api/` carry the
  token, is decided: they carry the backend's session cookie.

Documentation:

- Add an Authentication section to `AGENTS.md` (service, provisioning
  scripts, how admins reach the admin console on the tailnet) and mention
  the accounts step in `README.md`.

## Progress

Done and verified on the developer deployment: the Keycloak service and
database, the realm import, the ingress routing (only the avarc realm and
resources; admin console, master realm and traversal attempts answer 404),
the provisioning scripts, and the documentation. Role composites,
admin-console access of admins only, English and
German login pages and redirect URI restriction were checked.

Findings for the application part: the token lists only explicitly granted
roles, so no role means `viewer`; the audience `avarc-api` is set by a
mapper of the client `avarc-web`; the user profile makes first and last name
optional, otherwise accounts without them cannot log in. Stage and prod
(https origin) are not yet exercised. Login and logout through the backend are done
([AVARC-29](finished/TASK-backend-login.md),
[AVARC-30](finished/TASK-frontend-login.md)), which also settles the
token-relay question of the spec: browser calls carry the session cookie.
The realm roles are mapped to `ROLE_` authorities and reported by
`GET /api/auth/me`.
Open: role-based permissions per API endpoint and the editing controls (both
need the endpoints and pages of [AVARC-10](TASK-locations-crud-api.md) and
[AVARC-12](TASK-locations-ui.md)), bearer-token validation for clients
without a browser, and exercising stage and prod, which belongs to
[AVARC-27](TASK-stage-deployment.md).
