---
id: AVARC-14
type: task
status: finished
priority: normal
area: auth
depends-on: [AVARC-13, AVARC-8, AVARC-3, AVARC-6, AVARC-19]
created: 2026-10-11
---

# TASK: Ory integration

Spec: [SPEC-auth.md](../../spec/SPEC-auth.md)

Implements the decisions of [AVARC-13](TASK-ory-auth-design.md).

- Provide a self-hosted Ory Kratos instance for development as a service in
  the Compose project, with storage as allowed by the spec (own schema in
  the application database server, or its own database).
- Expose only the Kratos public API through the ingress `/auth/` prefix
  (prefix stripped, base URL `<origin>/auth/`), keep the admin API internal,
  and configure cookies, UI URLs and return URLs as specified.
- Protect the backend API: validate the session cookie via `whoami`, read
  the role from `metadata_public`, map it to permissions, answer 401/403;
  only the health endpoint is public.
- Add login, registration and logout pages to the frontend using the Kratos
  self-service flows, and show or hide editing controls based on the role
  reported by the backend.
- Decide how admins grant roles in the MVP (Kratos admin API directly or a
  backend endpoint) and update `spec/SPEC-auth.md`.
- Provide a shell script in `deploy/` that creates the accounts through
  `docker exec` into the Kratos container, for each environment. It reads
  the account credentials from the environment's secrets file (see
  [SPEC-deployment.md](../../spec/SPEC-deployment.md)), guarding the source
  line against inherited `xtrace`, and creates only the accounts that do
  not exist yet, so it is safe to run repeatedly. This includes the initial
  admin account.
- Document in `AGENTS.md` how to run that script and how admins reach the
  admin API or CLI (`docker compose exec`, or an SSH tunnel to a
  localhost-only port).

## Progress

Done: the Kratos service and ingress routing, the admin-access decision (Kratos admin API or CLI; no backend endpoint), the provisioning script and its documentation.
Open, blocked on AVARC-3 and AVARC-6: backend session validation and permission mapping, and the frontend login, registration and logout pages.

Superseded by [AVARC-19](TASK-auth-provider-revisit.md): the provider is Keycloak. The Kratos service, configuration and script this task produced are removed, and the remaining work done, by [AVARC-20](../TASK-keycloak-integration.md).
