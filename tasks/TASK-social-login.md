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

Spec: [SPEC-auth.md](../spec/SPEC-auth.md) ("Social login"),
[SPEC-deployment.md](../spec/SPEC-deployment.md) (open question about
Keycloak's database)

Users sign in at Keycloak with a Google account, as an addition to the local
accounts. Keycloak is the broker, so the backend and the frontend do not
change: the login page of the realm shows the button. Apple follows later
(a paid developer account and a signing key are needed), as a second identity
provider of the same kind.

## To do

- Specified (done): sign-up closed to roles, linking only by verified
  email, minimal scopes, the export and restore of users. Left to decide
  with AVARC-9: the wording of the privacy statement.
- Register the OAuth client with Google per environment (redirect URI is the
  broker endpoint of the realm on the public host).
- Configure the identity provider in the realm: a script like
  `deploy/create-user.sh`, run per environment, since a change of
  `avarc-realm.json` does not reach an existing realm. The client id and
  secret come from the environment's secrets file, never from the repository.
- The first-broker-login flow and the mapping of name and email onto the
  user record the backend creates at the first login.
- Survive a rebuild of Keycloak's data. The links (Google `sub`, user id,
  roles) live only in Keycloak's database, and `app_user.kc_subject` refers to
  the user id, so a lost database makes every user a new person. Two scripts
  using the Admin API (`curl` and `jq`, credentials from the secrets file):
  an export of the users with their `federatedIdentities` and realm roles
  into a gitignored file of mode 0600, run by the nightly backup timer next
  to the dumps, and a restore through `partialImport` with the original ids
  and `ifResourceExists` set to `SKIP`, so it is safe to repeat. Local
  passwords cannot be exported this way: restored local users get a new
  one-time password, as with `deploy/create-user.sh`. Test `partialImport`
  with fixed ids and links against a throwaway Keycloak first.
- Decide whether Keycloak keeps its database in the shared server or gets its
  own (open question in both specs, with the arguments); then record the
  decision there and, if it moves, change the Compose template, the backups
  and `deploy/create-db-user.sh`.
- Document the steps in `AGENTS.md` ("Authentication").

## Verification

A user export from a stage Keycloak, restored into an empty realm, gives the
same user ids, roles and Google links, and a Google user logs in as the same
person. A Google user logs in on dev, lands in the application without a role, gets
one from an admin and can then edit. A second login reuses the same user. A
Google account with an unverified email is not linked to a local account.
