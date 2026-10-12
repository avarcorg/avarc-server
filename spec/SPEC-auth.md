# SPEC: Authentication and Authorization

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define how users are identified and what they are allowed to do.

## Requirements

- Authentication, user management and role assignment are provided by a
  self-hosted Keycloak.
- The application does not store passwords, implement its own login flow or
  build its own user administration.
- The backend authenticates every request that is not explicitly public by
  validating the token issued via Keycloak.
- Authorization distinguishes at least viewing and editing locations; the
  roles are defined here.
- The first public version has basic user management: an admin can create
  accounts with a role, list them, change roles, disable or delete accounts
  and reset passwords without an email service. Users can log in, log out
  and change their own password. Self-registration is not offered.
- Login and account screens are available in English and German.

## Decisions

Decided in [AVARC-19](../tasks/finished/TASK-auth-provider-revisit.md),
which replaced the earlier choice of Ory Kratos
([AVARC-13](../tasks/finished/TASK-ory-auth-design.md)). Keycloak is
Apache-2.0 licensed.

- **Component:** Keycloak, in a single realm `avarc`. It provides the login,
  logout, account (change password) and admin screens, so none of them are
  built in this project.
- **Protocol and session model:** OpenID Connect, authorization code flow
  with PKCE. The frontend's server side is the OIDC client; the browser
  holds only the frontend's HttpOnly session cookie, never a token in
  scripts. The backend receives the user's access token and validates it
  locally (signature through the realm's published keys, issuer, audience,
  expiry); it does not call Keycloak per request. The token carries the
  explicitly granted roles only, so a user without any is a `viewer`. The single origin served
  by the ingress (see [SPEC-ingress.md](SPEC-ingress.md)) keeps CORS out of
  the picture.
- **Access policy:** login is required for everything; there is no anonymous
  access to the application or its API. Public exposure of data is the job
  of a separate read-only map server (post-MVP, see below), not of an
  anonymous mode in the backend.
- **Roles:** `viewer`, `editor` and `admin`, where `editor` includes
  `viewer` and `admin` includes `editor`.
  - `viewer`: list and read locations.
  - `editor`: additionally create, update and delete locations.
  - `admin`: additionally manage users and grant and revoke roles.
  - Every authenticated user is implicitly a `viewer`. Editor and admin are
    explicit grants.
- **Role storage:** the roles are Keycloak realm roles, with the inclusion
  above modelled as composite roles and `viewer` as the realm's default
  role. The token carries them and the backend maps them to permissions in
  code. The user id (`sub` claim) is what is stored as `created_by` /
  `updated_by` in [SPEC-locations.md](SPEC-locations.md). Per-location
  permissions are not part of the MVP.
- **Hosting:** Keycloak runs as the service `keycloak` in the Docker Compose
  project (see [SPEC-deployment.md](SPEC-deployment.md)). Its storage is a
  database of its own (`keycloak`) in the application's database server,
  created on demand at startup. Production mode is used in every
  environment; the developer deployment differs only in its plain-http
  origin.
- **Configuration as code:** the realm (roles, client, login and password
  settings, locales) is kept in the repository as a realm import file
  without secrets; secrets such as the client secret come from the
  environment's secrets file. Keycloak imports it only when the realm does
  not exist yet, so later changes to an existing environment are applied
  with the admin console or its CLI.
- **User administration:** by admins in the Keycloak admin console of the
  `avarc` realm (users, roles, disable, delete, set a temporary password
  that must be changed at the next login). The initial admin account, and
  optionally editor and viewer accounts of an environment, are created by a
  provisioning script in `deploy/` from credentials in the environment's
  secrets file; it skips accounts that already exist. The backend has no
  user-management endpoints.
- **Account policies:** self-registration, "forgot password" and email
  verification are disabled because there is no email service in the MVP;
  admins reset passwords. Brute-force protection is enabled. Users change
  their own password in Keycloak's account console. English and German are
  the enabled locales.
- **Exposure via the ingress:** builds on the `/auth/` prefix of
  [SPEC-ingress.md](SPEC-ingress.md).
  - Only the realm endpoints and static resources of the `avarc` realm are
    routed (login, token, keys, logout, account console). The admin console,
    the admin REST API, the `master` realm and the management and health
    port are never routed by the ingress; admins reach the console on the
    tailnet under a name of its own (see
    [SPEC-deployment.md](SPEC-deployment.md)).
  - Keycloak is served under `/auth` without prefix stripping and is
    configured with the public origin as its hostname, trusting the
    forwarded headers of the ingress.
  - Cookies are host-only and `Secure`; the redirect URIs of the client are
    limited to the application's own origin.

## Public read-only map server (post-MVP)

Anonymous viewing is served by a separate, read-only map server added after
the MVP, outside the authenticated application. It exposes only data
intended for the public, has no write capability and no Keycloak
dependency. It gets its own ingress prefix and is specified when it is taken
up.

## MCP server (post-MVP)

The MCP server authenticates AI assistants with tokens issued by the same
Keycloak realm; Keycloak supports this natively, so no further identity
component is expected. The details are specified when it is taken up.

## Open questions

- Which locations are public for the read-only map server.
- Whether browser calls to `/api/` carry the access token themselves or go
  through the frontend's server side, which relays it; decided with the
  integration ([AVARC-20](../tasks/TASK-keycloak-integration.md)) once the
  backend and frontend stacks are chosen.
- The capacity of the production host for Keycloak.
