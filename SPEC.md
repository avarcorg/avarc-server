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
- Public self-registration policy, moderation and import/export; to be
  specified when needed.

## Architecture overview

- **Frontend:** Next.js web application.
- **Backend:** Java/Kotlin service exposing an API consumed by the frontend.
- **Web server:** a web server in front of all partial applications
  (frontend, backend, Ory) is the single entry point for clients. Which
  product is used is to be decided.
- **Identity:** self-hosted Ory handles authentication and authorization;
  the backend and frontend delegate to it rather than implementing their own.

## Area specs

- [Locations](spec/SPEC-locations.md): data model for historical locations.
- [Auth](spec/SPEC-auth.md): authentication and authorization with Ory.
- [Backend](spec/SPEC-backend.md): Java/Kotlin API service.
- [Frontend](spec/SPEC-frontend.md): Next.js web application.
- [Ingress](spec/SPEC-ingress.md): web server in front of the partial applications.
- [Dependency updates](spec/SPEC-dependency-updates.md): Renovate setup.
- [Code scanning](spec/SPEC-code-scanning.md): CodeQL setup.
- [Architecture diagram](spec/SPEC-architecture-diagram.md): diagram of the system.

## Open questions

- Who may view, who may edit? (anonymous read vs. login required)
- Language(s) of descriptions; single or multiple.
- Deployment target and environments.
