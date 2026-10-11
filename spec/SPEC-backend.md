# SPEC: Backend

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define the API service that stores and serves locations.

## Requirements

- Implemented in Java or Kotlin.
- Exposes an HTTP API for creating, reading, updating, deleting and listing
  locations, as defined by [SPEC-locations.md](SPEC-locations.md).
- Enforces authentication and authorization as defined by
  [SPEC-auth.md](SPEC-auth.md).
- Persists data in a database that can store and query geographic
  coordinates.

## Open questions

- Java vs. Kotlin, framework and build tool.
- Database choice.
- API style and documentation (REST + OpenAPI vs. other).
