---
id: AVARC-10
type: task
status: in-progress
priority: normal
area: backend
depends-on: [AVARC-3, AVARC-11]
created: 2026-10-11
---

# TASK: Locations CRUD API

Spec: [SPEC-backend.md](../spec/SPEC-backend.md), [SPEC-locations.md](../spec/SPEC-locations.md)

- Implement create, read, update, delete and list for locations.
- Persist to the chosen database.
- **Schema:** the tables go into the schema `avarc` as a new Flyway
  migration, as decided in [AVARC-42](finished/TASK-user-entities.md) and
  written in [SPEC-backend.md](../spec/SPEC-backend.md).
- Cover with tests.
- The locations code is an application module of its own under the module
  rule of [SPEC-backend.md](../spec/SPEC-backend.md)
  ([AVARC-35](finished/TASK-modulith-verification.md)).
- **Authorization** (carried over from
  [AVARC-20](finished/TASK-keycloak-integration.md)): enforce the realm roles
  per endpoint (`ROLE_<role>`, already mapped) and answer 401 and 403.
- **Open:** the usage of tags is not settled and is revisited later (see the
  open questions of [SPEC-locations.md](../spec/SPEC-locations.md)). The
  code is pushed as it is; the task stays in progress until that is decided.
