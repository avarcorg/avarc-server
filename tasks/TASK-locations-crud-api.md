---
id: AVARC-10
type: task
status: open
priority: normal
area: backend
depends-on: [AVARC-3, AVARC-11]
created: 2026-10-11
---

# TASK: Locations CRUD API

Spec: [SPEC-backend.md](../spec/SPEC-backend.md), [SPEC-locations.md](../spec/SPEC-locations.md)

- Implement create, read, update, delete and list for locations.
- Persist to the chosen database.
- **Existing schema:** the `public` schema of the PostGIS database is never
  empty: the extension creates `spatial_ref_sys` there, and the schemas
  `tiger`, `tiger_data` and `topology` exist as well. A migration tool that
  refuses to run on a non-empty schema (Flyway does by default) needs an
  explicit answer, decided with the persistence setup and written into
  [SPEC-backend.md](../spec/SPEC-backend.md): baseline on first run, a
  schema of its own for the application's tables, or ignoring the objects
  that belong to the extension. This holds for every task that adds tables,
  [AVARC-42](TASK-user-entities.md) included.
- Cover with tests.
- The locations code is an application module of its own under the module
  rule of [SPEC-backend.md](../spec/SPEC-backend.md)
  ([AVARC-35](finished/TASK-modulith-verification.md)).
