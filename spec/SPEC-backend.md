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
