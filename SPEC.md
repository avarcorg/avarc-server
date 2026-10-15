# avarc-server — Specification

A web-based application to record, manage and display locations of
historical importance, each with a description.

This is the main global spec. Requirements for a specific area of
responsibility live in `spec/SPEC-<area>.md`.

## Goals

- Record locations of historical importance with descriptions.
- Manage (create, edit, delete) those records.
- Display them, in particular on a map.

## Non-goals (for now)

- Anything beyond point locations; richer geometry is deferred to the
  locations spec.
- The MCP server; planned for after the MVP (see the architecture overview).
- Public self-registration policy, moderation and import/export; to be
  specified when needed.

## Architecture overview

- **Frontend:** Next.js web application.
- **Backend:** Java Spring Boot service exposing an API consumed by the
  frontend.
- **Web server:** a web server in front of all partial applications
  (frontend, backend, Keycloak) is the single entry point for clients. It is
  nginx, serving one host with path prefixes (see the ingress spec).
- **Identity:** self-hosted Keycloak handles authentication, user
  management and roles; the backend and frontend delegate to it rather than
  implementing their own.
- **Public map server (after the MVP):** a separate read-only server exposes
  data intended for the public. The application itself requires login (see
  the auth spec).
- **MCP server (after the MVP):** an MCP server will be added after the MVP
  so that AI assistants can use the application. It sits behind the web
  server, uses the backend API rather than the database, and authenticates
  through Keycloak. It is not part of the MVP and is specified when it is taken
  up.

The [architecture diagram](spec/architecture-diagram.md) shows these
components and their connections.

## Global decisions

- **Time:** all timestamps are stored in UTC. Conversion to a local time zone
  happens only when presenting to a user.
- **Languages:** the application is multi-language. The first languages are
  English and German; further languages can be added later.

## Area specs

- [Locations](spec/SPEC-locations.md): data model for historical locations.
- [Auth](spec/SPEC-auth.md): authentication, user management and authorization with Keycloak.
- [Backend](spec/SPEC-backend.md): Java Spring Boot API service.
- [Frontend](spec/SPEC-frontend.md): Next.js web application.
- [Ingress](spec/SPEC-ingress.md): web server in front of the partial applications.
- [Deployment](spec/SPEC-deployment.md): Docker Compose project, developer deployment.
- [Dependency updates](spec/SPEC-dependency-updates.md): Renovate setup.
- [Code scanning](spec/SPEC-code-scanning.md): CodeQL setup.
- [Releases](spec/SPEC-releases.md): version tags and release notes.
- [Work tracking](spec/SPEC-work-tracking.md): file-based tracking of work items.
- [Architecture diagram](spec/SPEC-architecture-diagram.md): diagram of the system.

## Open questions

- Deployment target and environments beyond the developer deployment.
