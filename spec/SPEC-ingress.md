# SPEC: Ingress web server

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define the web server that sits in front of the partial applications.

## Requirements

- Clients reach the frontend, the backend API and the Ory endpoints only
  through this web server.
- It routes requests to the right partial application.
- It terminates TLS.

## Decisions

Decided in [AVARC-8](../tasks/finished/TASK-ingress-decision.md).

- **Product:** Caddy. It terminates TLS with automatic certificate handling
  and needs only a small configuration, which suits the developer
  deployment as well as production.
- **URL layout:** one host with path prefixes, so the browser sees a single
  origin (no CORS, simple cookie sessions):
  - `/api/` routes to the backend.
  - `/auth/` routes to the Ory public endpoints (login, registration and
    logout flows).
  - everything else routes to the frontend.
  - The prefixes are reserved and are not used by frontend pages. A
    post-MVP MCP server gets its own prefix when it is taken up.
- **Authentication:** the ingress only routes and forwards requests,
  including the session credentials, unchanged. It does not enforce
  authentication; the backend validates the session or identity of every
  non-public request, as required by [SPEC-auth.md](SPEC-auth.md). This
  keeps a single enforcement point. If AVARC-13 decides otherwise, this
  decision is revisited there.

## Open questions

- Caching, compression and rate limiting.
