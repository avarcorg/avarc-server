# SPEC: Backend

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define the API service that stores and serves locations.

## Requirements

- Implemented in Java as a Spring Boot monolith using Spring Modulith, built
  with Maven.
- Exposes an HTTP API for creating, reading, updating, deleting and listing
  locations, as defined by [SPEC-locations.md](SPEC-locations.md).
- Enforces authentication and authorization as defined by
  [SPEC-auth.md](SPEC-auth.md).
- Persists data in PostgreSQL with the PostGIS extension, which stores and
  queries geographic coordinates.
- The API is REST with JSON bodies under `/api/`, described by an OpenAPI
  document generated from the code and served by the backend.

## Decisions

- **Language, framework, build:** Java with Spring Boot and Maven. Spring
  Security's OAuth2 client logs users in at Keycloak and keeps the session
  ([SPEC-auth.md](SPEC-auth.md)); the OAuth2 resource server for bearer
  tokens is added when a client needs it.
- **Architecture:** a monolithic application built with Spring Modulith:
  one deployable Spring Boot service holds the whole API and its business
  logic, structured into application modules whose boundaries Spring
  Modulith verifies; there are no separate microservices.
- **Modules:** introduced in
  [AVARC-35](../tasks/finished/TASK-modulith-verification.md). An
  application module is a direct sub-package of `org.avarc.server`; the
  types in its top-level package are its API and its sub-packages are
  internal; modules depend on each other only through that API and without
  cycles; the root package holds the application class only. A test calls
  `ApplicationModules.verify()`, so `./mvnw verify` fails when a boundary is
  broken, and it writes the module diagrams to the build directory. The
  modules today are `auth` ([SPEC-auth.md](SPEC-auth.md)), `user`
  ([SPEC-users.md](SPEC-users.md)), `apidocs` (the
  API description, below) and `hello` (a placeholder endpoint); the
  locations ([SPEC-locations.md](SPEC-locations.md)) are a module of their
  own when they are implemented ([AVARC-10](../tasks/TASK-locations-crud-api.md)).
  A new area of the backend starts as a new module.
- **Database:** PostgreSQL with PostGIS. A `point` position is stored as a
  `geography(Point, 4326)` column (WGS 84) next to the `kind` discriminator
  column, so further kinds ([SPEC-locations.md](SPEC-locations.md)) add
  columns or tables without changing existing rows. Locations carry the UUID
  as their identity and may have an internal numeric surrogate key.
  Schema changes are applied by versioned migrations.
- **Persistence setup:** introduced in [AVARC-42](../tasks/finished/TASK-user-entities.md).
  Spring Data JPA with Hibernate, migrations by Flyway, which the backend
  runs at startup. The `public` schema of the PostGIS database is never
  empty (the extension's tables, and the schemas `tiger`, `tiger_data` and
  `topology`), so the application's tables live in the schema `avarc`, which
  the first migration creates; Flyway manages that schema only. Hibernate
  validates the mapping against it and never changes it. The connection is
  configured at runtime (address, database and user in the environment, the
  password a file secret). Tests that touch the database run against a
  PostGIS container (Testcontainers).
- **Java format:** introduced in [AVARC-44](../tasks/TASK-java-formatter.md).
  The Java sources (`src/main/java`, `src/test/java`) are formatted by
  Open Java Format (MIT licensed, a drop-in for palantir-java-format, lines
  of 120 characters), which has one style and no options, so formatting is
  never discussed or configured. The Maven plugin
  `dev.openjavaformat:fmt-maven-plugin` runs in the backend module with the
  formatter version it selects; both versions are properties of the
  module's `pom.xml`, which Renovate updates. It was checked with Java 25.
  A normal build rewrites the sources (`format` in `process-sources`); when
  the environment variable `CI` is set, or with `-Pformat-check`, the build
  fails on unformatted code instead (`check`), so CI never changes what it
  built. The pre-commit hook runs the check when Java files are staged
  ([SPEC-work-tracking.md](SPEC-work-tracking.md)), and the check is a code
  quality check of its own ([SPEC-code-scanning.md](SPEC-code-scanning.md)).
  The commit that first formatted the code is listed in
  `.git-blame-ignore-revs`. Anyone who writes Java, agents included, formats
  it before showing a diff and before committing
  (`tools/java-format.sh`, see `AGENTS.md`).
- **Actuator:** only `health` is exposed by default; the `dev` and `stage`
  environments, through the Spring profile of the same name, expose all
  actuator endpoints.
- **API:** REST + OpenAPI, generated from the code (springdoc). Other
  consumers, such as API keys or an MCP adapter, use the same API.
- **API description and Swagger UI:** introduced in
  [AVARC-34](../tasks/finished/TASK-api-docs.md). The OpenAPI document
  (`/api/docs/openapi.json`) and Swagger UI (`/api/docs`) are served in the
  `dev` and `stage` environments only, enabled by their Spring profile like
  the actuator endpoints; prod serves neither. They are under `/api/`, so
  the ingress routes them without a rule of their own. They are readable
  without a login, and only where springdoc is enabled: the security
  configuration opens those paths on the same setting, so a prod
  deployment cannot open them by mistake. The endpoints themselves are
  unchanged and need a login; "Try it out" in Swagger UI uses the session
  cookie of a login on the same origin and, for requests that change data,
  the CSRF token that `GET /api/auth/me` reports, which the page describes.
  Opening the endpoints themselves would be a change of the security model
  and needs a decision of its own.
