# SPEC: Authentication and Authorization

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define how users are identified and what they are allowed to do.

## Requirements

- Authentication, user management and role assignment are provided by a
  self-hosted Keycloak.
- The application does not store passwords, implement its own login flow or
  build its own user administration.
- The backend authenticates every request that is not explicitly public,
  through the session established by a login at Keycloak.
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
  with PKCE. The backend is the OIDC client (the confidential client
  `avarc-web`) and the only component that talks to Keycloak; the frontend
  talks to the backend. The backend keeps the tokens in a server-side
  session; the browser holds only the backend's HttpOnly session cookie,
  never a token. The access token carries the explicitly granted roles
  only, so a user without any is a `viewer`. The single origin served by
  the ingress (see [SPEC-ingress.md](SPEC-ingress.md)) keeps CORS out of
  the picture. Validating bearer access tokens, for clients without a
  browser such as the MCP server, is added when such a client is taken up.
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
- **Backend module:** the backend code of this area is the application
  module `auth` ([SPEC-backend.md](SPEC-backend.md)); other modules reach
  it only through its top-level package.
- **Login and logout:** the pages `/login` and `/logged-out` belong to the
  frontend ([SPEC-frontend.md](SPEC-frontend.md)); the password form is
  Keycloak's. The backend offers, under `/api/auth/`:
  - `GET /api/auth/login/keycloak` starts the login: a redirect to the realm's
    authorization endpoint with PKCE. `GET /api/auth/callback` receives the
    code, exchanges it with the client secret, creates the session and
    redirects to `/`. A failed login redirects to `/login?error`.
  - `POST /api/auth/logout` ends the session and redirects to Keycloak's
    end-session endpoint, which returns to `/logged-out`. It requires the
    CSRF token.
  - `GET /api/auth/me` answers `200` with `username`, `name`, `email`,
    `roles` and `csrfToken` of the logged-in user, or `401`.
  - Every other request without a session, `/api/` included, answers `401`;
    only these login endpoints and the health endpoint are public. The
    development and stage actuator endpoints stay as in
    [SPEC-backend.md](SPEC-backend.md).
  - The backend reaches Keycloak by its internal address for the token and
    key requests, and sends the browser to the public one
    (`<public origin>/auth/realms/avarc`); the issuer of the tokens is the
    public one. It reads the realm's endpoints from its configuration, not
    by discovery, so it starts without Keycloak. The client secret is a
    file secret.
  - The session cookie is HttpOnly, `Secure` (except on the plain-http
    developer origin) and `SameSite=Lax`; the session expires after 30
    minutes without use and is kept in memory, so a restart of the backend
    logs everyone out.
- **Role storage:** the roles are Keycloak realm roles, with the inclusion
  above modelled as composite roles and `viewer` as the realm's default
  role. The token carries them and the backend maps them to permissions in
  code. The user id (`sub` claim) is what is stored as `created_by` /
  `updated_by` in [SPEC-locations.md](SPEC-locations.md). Per-location
  permissions are not part of the MVP.
- **Application users:** Keycloak owns accounts, credentials and roles. The
  application keeps its own `User` per Keycloak subject for preferences and
  a copy of the profile claims, created at the login
  ([SPEC-users.md](SPEC-users.md)).
- **Hosting:** Keycloak runs as the service `keycloak` in the Docker Compose
  project (see [SPEC-deployment.md](SPEC-deployment.md)). Its storage is a
  database of its own (`keycloak`) in the application's database server,
  created on demand at startup (decided, see
  [SPEC-deployment.md](SPEC-deployment.md), "Keycloak's database"). Production mode is used in every
  environment; the developer deployment differs only in its plain-http
  origin.
- **Image:** introduced in [AVARC-32](../tasks/finished/TASK-keycloak-image.md).
  Keycloak runs from an image of this project, built on the pinned Keycloak
  image by a `Dockerfile` in the module `avarc-server-keycloak` (see
  [SPEC-releases.md](SPEC-releases.md) for versioning and publishing). It
  holds the realm import file, the start script as the entrypoint, and
  Keycloak's build-time options (database vendor, health endpoints, the
  `/auth` relative path) applied with `kc.sh build`, so that it starts with
  `--optimized`. Nothing environment-specific or secret is in it: hostnames,
  the database address and every secret are runtime configuration, the
  secrets read from `/run/secrets`. The Keycloak version is the tag in the
  `FROM` line of the `Dockerfile`, which Renovate updates. A `Dockerfile`
  built with `docker build` is the exception to the buildpack build of the
  other images. Paketo with a `Procfile` was tried and can run Keycloak, but
  needs the distribution downloaded into the build, a full run image for
  `bash`, and cannot run `kc.sh build`, which loses the optimized start; a
  Dockerfile of a few lines avoids all of it.
- **Configuration as code:** the realm (roles, client, login and password
  settings, locales) is kept in the repository as a realm import file
  without secrets, inside the image; secrets such as the client secret come
  from the environment's secrets file. Keycloak imports it only when the
  realm does not exist yet, so a change of the file reaches an existing
  environment only through the admin console or its CLI; a new image version
  carries it to new realms only.
- **User administration:** by admins in the Keycloak admin console of the
  `avarc` realm (users, roles, disable, delete, set a temporary password
  that must be changed at the next login). The initial admin account, and
  optionally editor and viewer accounts of an environment, are created by a
  provisioning script in `deploy/` from credentials in the environment's
  secrets file; it skips accounts that already exist. Further users are
  created by a second script, which takes email addresses and makes them
  editors, or admins with an option; each gets a random one-time password
  that must be changed at the first login, or, with an option, a password
  read per user that stays valid. The backend has no
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

## Social login

Decided in [AVARC-54](../tasks/TASK-social-login.md); not yet implemented.

- **Providers:** Google first; Apple later as a second identity provider of
  the same kind (it needs a paid developer account and a signing key). Other
  providers are added the same way.
- **Keycloak is the broker.** Users choose the provider on the login page of
  the `avarc` realm; the backend, which is the only OIDC client, and the
  frontend do not change. The application database keeps referring to the
  Keycloak user id (`kc_subject`), whatever the provider.
- **Sign-up stays closed to roles.** A user who signs in with a provider for
  the first time gets a Keycloak account without any role, so cannot do
  anything until an admin grants one in the console, as for any new user.
  Self-registration with a password stays disabled.
- **Linking.** A provider identity is never linked to an existing account
  automatically. The first-login flow of the realm (`avarc-first-broker-login`,
  created by `deploy/create-google-idp.sh`) creates a new user from
  the provider's name and email, without a role and without a profile
  review, when no account has that email. When one has, the login is denied
  with a message telling the user to sign in with the password and link the
  provider under Account, Linked accounts: the user proves control of both.
  Keycloak's own flow would verify an existing account by an email that this
  installation cannot send, and trusting the provider's email blindly would
  link accounts whose email the provider has not verified. Linking
  automatically when the provider reports the email as verified is a later
  improvement ([AVARC-55](../tasks/TASK-automatic-linking.md)). The link is
  the provider's stable account id, not the email address, so a later change
  of email does not break it. The email of the provider is not trusted as
  verified by Keycloak, and no tokens are stored.
- **Personal data.** Only name and email are taken from the provider, and
  nothing else is requested (scopes `openid`, `email`, `profile`). What the
  provider passes on is part of the privacy statement
  ([AVARC-9](../tasks/TASK-licensing-decision.md)).
- **Configuration.** The OAuth client is registered with the provider per
  environment; its id and secret come from the environment's secrets file and
  never from the repository. The identity provider is configured in the realm
  by a script in `deploy/` that is safe to repeat, because a change of
  `avarc-realm.json` does not reach an existing realm.

### Surviving a rebuild of Keycloak's data

The provider links (provider account id, Keycloak user id) and the roles live
only in Keycloak's database, and the application's users refer to the user
id. If that database is lost without a restore, every user logs in as a new
person: new id, no roles, no preferences, no tie to earlier contributions.

- The primary protection is the backup of the databases
  ([SPEC-deployment.md](SPEC-deployment.md)); a restore of the dump brings
  everything back, local passwords included.
- A second protection works without a dump. A script exports the users of the
  realm through the Keycloak Admin API: id, username, email, names, enabled
  flag, attributes, the provider links and the realm roles. The script is
  `deploy/export-keycloak-users.sh [--stage]`; it writes
  `keycloak-users-<yyyymmdd-hhmmss>.json` (the realm, the time and the list of
  users) into the backups directory of the environment, next to the dumps, and
  the file appears under its final name only when complete. It is gitignored,
  has mode 0600 and is produced by the same nightly run as the dumps
  (`deploy/backup-db.sh`), under the same retention; a failed export makes
  that run fail, after the dumps are taken. It holds personal data. The
  default role of the realm is not exported, because every user has it.
- A restore script, `deploy/restore-keycloak-users.sh [--stage] [FILE]` (default the
  newest export), reads that file and recreates the users through the
  `partialImport` endpoint, with their original ids, links and roles, and
  skips what exists, so running it twice changes nothing. The realm and its
  identity providers must exist first; the script stops with a message when a
  provider of a link is missing.
- Local passwords are not available through the API: a restored local user
  gets a new one-time password, as with `deploy/create-user.sh`, printed once
  as "EMAIL PASSWORD" on the standard output, for the users it created
  only. Users of a provider have no local password and lose nothing.
- Direct changes to Keycloak's tables are not a restore method.

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
- The capacity of the production host for Keycloak.
