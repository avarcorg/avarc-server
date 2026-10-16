---
id: AVARC-42
type: task
status: finished
priority: normal
area: backend
depends-on: [AVARC-29, AVARC-35]
created: 2026-10-15
---

# TASK: User entities

Spec: [SPEC-backend.md](../../spec/SPEC-backend.md),
[SPEC-auth.md](../../spec/SPEC-auth.md)

Keycloak owns the accounts, credentials and roles
([SPEC-auth.md](../../spec/SPEC-auth.md)); the application has no record of
its own users. It needs one, to attach data of the application to a person,
starting with their preferences. A `User` entity is created in the
application database when someone logs in successfully through Keycloak.

## Specification phase

Before code, the frontend-independent parts are written into the specs:
the entity, the rule for creating and updating it, and what is imported
from Keycloak. `SPEC-auth.md` states what stays with Keycloak and what the
application keeps; `SPEC-backend.md` names the new module.

## Suggested implementation

- **Module:** the backend code is an application module of its own, `user`,
  a direct sub-package of `org.avarc.server`, under the module rule of
  [SPEC-backend.md](../../spec/SPEC-backend.md)
  ([AVARC-35](TASK-modulith-verification.md)). Its API is the types
  in its top-level package; entity, repository and persistence stay in
  internal sub-packages. `auth` does not depend on `user` internals, and
  the two modules do not form a cycle: the login in `auth` announces a
  successful login as an application event (a type in the API of `auth`),
  and `user` listens to it, so `auth` needs no reference to `user`.
  `ModularityTests`, part of `./mvnw verify`, must stay green, and the
  module appears in the generated diagrams.
- **Identity:** the user is identified by the Keycloak subject (`sub`) of
  the realm, stored unique; the entity has its own UUID as identity, like
  the locations ([SPEC-locations.md](../../spec/SPEC-locations.md)). The
  application never matches users by email or name, which can change.
- **Creation:** on the first successful login, no user exists for the
  subject yet and one is created. A later login finds it. Creation is
  idempotent: two simultaneous first logins end with one user (unique
  constraint, retried read), not an error for the person logging in.
  A failure to store the user must not block the login unless the spec
  decides otherwise.
- **Imported properties (optional):** profile claims that Keycloak holds,
  such as first name, last name, display name and email, copied from the ID
  token at login and refreshed at each login, so they follow changes made
  in Keycloak. Keycloak stays the source of truth; the application never
  edits them and treats them as read-only. Whether to store them at all or
  to read them from the session on demand is decided in the specification
  phase, with a view to data protection: keep only what a feature uses.
  Roles are not copied; they stay in the token ([SPEC-auth.md](../../spec/SPEC-auth.md)).
- **Preferences:** the entity holds the user's preferences, owned by the
  application. The first one is the appearance, `light`, `dark` or
  `system` (default, follow the browser). The language is a candidate for
  the same place. Stored in a form that lets preferences be added without
  a schema change per preference (for example a JSON column), as the spec
  decides. Only the storage is part of this task; applying the appearance
  in the frontend is implemented later, in its own task.
- **API:** the logged-in user reads their own record and updates their own
  preferences (for example `GET` and `PATCH` on `/api/users/me`), nobody
  else's. `GET /api/auth/me` keeps its meaning. The endpoints show up in
  the OpenAPI document.
- **Database:** a versioned migration creates the table
  ([SPEC-backend.md](../../spec/SPEC-backend.md)). The persistence setup
  (JPA, migrations, test database, and the handling of the existing schema
  described there) is shared with the locations
  ([AVARC-10](TASK-locations-crud-api.md)); whichever task comes first
  sets it up, the other uses it.
- **Deleting accounts:** an account deleted in Keycloak leaves its user
  record behind; what happens to it is decided in the specification phase
  and written down.

## Acceptance

- The module rule holds: `ModularityTests` passes and the `user` module is
  in the generated diagrams.
- The first login creates exactly one user; later logins reuse it and
  refresh the imported properties, if the spec keeps them.
- A user can read their own record and change their preferences, and
  cannot reach anyone else's.
- The specs describe the entity, the creation rule, the imports and the
  preferences before or together with the code.
- `./mvnw verify` passes.
