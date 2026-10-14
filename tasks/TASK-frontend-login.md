---
id: AVARC-30
type: task
status: open
priority: high
area: frontend
depends-on: [AVARC-29, AVARC-6]
created: 2026-10-14
---

# TASK: Frontend login and logout pages

Spec: [SPEC-auth.md](../spec/SPEC-auth.md) (Login and logout),
[SPEC-frontend.md](../spec/SPEC-frontend.md)

Follows [AVARC-29](TASK-backend-login.md); part of the application work of
[AVARC-20](TASK-keycloak-integration.md).

- Page `/login`: a short explanation and one sign-in link to the backend's
  login endpoint. It shows a message when the login failed. The password
  form is Keycloak's.
- Page `/logged-out`: confirms that the user is logged out, with a link to
  sign in again. Public.
- Home page: asks the backend for the current user on the server side,
  forwarding the session cookie (`BACKEND_URL` in the Compose project), and
  sends visitors without a session to `/login`. Shows who is signed in with
  the roles, and a logout button, a form posting to the backend's logout
  endpoint with the CSRF token.
- The pages are English only for now; the translations (English and German)
  come with the internationalisation of the frontend.

## Verification

Through the ingress of the developer deployment: `/` redirects to `/login`,
signing in returns to `/` with the user shown, the logout button ends up on
`/logged-out`, and `/` redirects to `/login` again.
