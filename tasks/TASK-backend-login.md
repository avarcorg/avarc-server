---
id: AVARC-29
type: task
status: open
priority: high
area: auth
depends-on: [AVARC-20, AVARC-3]
created: 2026-10-14
---

# TASK: Backend login and logout

Spec: [SPEC-auth.md](../spec/SPEC-auth.md) (Login and logout),
[SPEC-backend.md](../spec/SPEC-backend.md)

Part of the application work of [AVARC-20](TASK-keycloak-integration.md);
followed by [AVARC-30](TASK-frontend-login.md), the pages that use it. The
frontend talks to the backend, and only the backend talks to Keycloak.

- Make the backend the OIDC client of Keycloak: authorization code flow with
  PKCE for the confidential client `avarc-web`, a server-side session and an
  HttpOnly session cookie. The browser never holds a token.
- Endpoints below `/api/auth/` as specified: start the login, receive the
  callback, log out (ending the session and the Keycloak session), and
  report the current user with its roles and the CSRF token.
- Reach Keycloak by its internal address for token and key requests; send
  the browser to its public address. No discovery at startup, so the backend
  starts without Keycloak.
- Map the realm roles of the access token to authorities; every user is at
  least a `viewer`.
- Everything except the health endpoint and the login endpoints requires a
  session and answers 401 (no redirect) otherwise.
- Pass the client secret to the backend as a file secret and the public
  origin as an environment variable in the Compose project.
- Tests: unauthenticated 401, the redirect to Keycloak with PKCE, the user
  report with roles, logout redirect and CSRF protection of the logout.

## Verification

Log in as the accounts of `deploy/create-admin-user.sh` on the developer
deployment, with `curl` through the ingress, and check the user report and
the logout.
