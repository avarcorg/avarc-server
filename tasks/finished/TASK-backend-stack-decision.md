---
id: AVARC-4
type: decision
status: finished
priority: normal
area: backend
depends-on: [AVARC-11]
created: 2026-10-11
---

# TASK: Backend technology decisions

Spec: [SPEC-backend.md](../../spec/SPEC-backend.md)

- Choose Java vs. Kotlin, framework and build tool.
- Choose the database and how coordinates are stored and queried.
- Choose API style and documentation approach.
- Update `spec/SPEC-backend.md` with the decisions.

Decided: a Java Spring Boot monolith with Spring Modulith, built with Maven;
PostgreSQL with PostGIS (`geography(Point, 4326)`); REST + OpenAPI. Recorded
in [SPEC-backend.md](../../spec/SPEC-backend.md).
