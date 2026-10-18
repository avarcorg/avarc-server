---
id: AVARC-54
type: task
status: open
priority: low
area: auth
created: 2026-10-18
depends_on: [AVARC-20]
---

# TASK: Social login with Google (Apple later)

Spec: [SPEC-auth.md](../spec/SPEC-auth.md)

Users sign in at Keycloak with a Google account, as an addition to the local
accounts. Keycloak is the broker, so the backend and the frontend do not
change: the login page of the realm shows the button. Apple follows later
(a paid developer account and a signing key are needed), as a second identity
provider of the same kind.

## To do

- Decide, and write into `SPEC-auth.md`: sign-up stays closed (a new social
  user has no role until an admin grants one); an account is linked to an
  existing one by email only when the provider reports the email as verified;
  what personal data the provider passes on (see
  [AVARC-9](TASK-licensing-decision.md) for the privacy side).
- Register the OAuth client with Google per environment (redirect URI is the
  broker endpoint of the realm on the public host).
- Configure the identity provider in the realm: a script like
  `deploy/create-user.sh`, run per environment, since a change of
  `avarc-realm.json` does not reach an existing realm. The client id and
  secret come from the environment's secrets file, never from the repository.
- The first-broker-login flow and the mapping of name and email onto the
  user record the backend creates at the first login.
- Document the steps in `AGENTS.md` ("Authentication").

## Verification

A Google user logs in on dev, lands in the application without a role, gets
one from an admin and can then edit. A second login reuses the same user. A
Google account with an unverified email is not linked to a local account.
