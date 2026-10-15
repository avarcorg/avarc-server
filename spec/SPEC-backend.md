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
  Modulith verifies; there are no separate microservices. Introduced in
  [AVARC-35](../tasks/TASK-modulith-verification.md): an application module
  is a direct sub-package of `org.avarc.server`; the types in its top-level
  package are its API and its sub-packages are internal; modules depend on
  each other only through that API and without cycles; the root package
  holds the application class only. A test calls
  `ApplicationModules.verify()`, so `./mvnw verify` fails when a boundary is
  broken.
- **Database:** PostgreSQL with PostGIS. A `point` position is stored as a
  `geography(Point, 4326)` column (WGS 84) next to the `kind` discriminator
  column, so further kinds ([SPEC-locations.md](SPEC-locations.md)) add
  columns or tables without changing existing rows. Locations carry the UUID
  as their identity and may have an internal numeric surrogate key.
  Schema changes are applied by versioned migrations.
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
