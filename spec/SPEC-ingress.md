# SPEC: Ingress web server

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define the web server that sits in front of the partial applications.

## Requirements

- Clients reach the frontend, the backend API and the Keycloak endpoints only
  through this web server.
- It routes requests to the right partial application.
- TLS is terminated in front of it (see
  [SPEC-deployment.md](SPEC-deployment.md)).

## Decisions

Decided in [AVARC-8](../tasks/finished/TASK-ingress-decision.md).

- **Product:** nginx, changed from Caddy in
  [AVARC-33](../tasks/finished/TASK-ingress-image.md) (which first chose Caddy,
  [AVARC-8](../tasks/finished/TASK-ingress-decision.md)). nginx is a web
  server of the Paketo buildpacks, so the ingress image is built with
  `pack` like the backend and the frontend, through the shared build
  configuration, from the configuration file `nginx.conf` alone; Caddy has
  no buildpack. The configuration is in the module `avarc-server-ingress`
  and is part of the image; the nginx version is the one the buildpack
  selects. The image listens on port 8080 and runs as the unprivileged user
  of the buildpack run image. The upstreams (`backend`, `frontend`,
  `keycloak`) are looked up per request through Docker's resolver, so a
  restarted service is found again and the ingress starts before they do.
- **URL layout:** one host with path prefixes, so the browser sees a single
  origin (no CORS, simple cookie sessions):
  - `/api/` routes to the backend.
  - `/actuator/` routes to the backend's actuator endpoints. This is for
    development and stage and will be disabled in prod.
  - `/auth/` routes to the public endpoints of Keycloak (login, logout,
    token and account pages), without prefix stripping; which of its paths
    are routed is defined in [SPEC-auth.md](SPEC-auth.md).
  - everything else routes to the frontend, including its `/health` (status
    only, as `/actuator/health` of the backend).
  - The prefixes are reserved and are not used by frontend pages. A
    post-MVP MCP server gets its own prefix when it is taken up.
- **Authentication:** the ingress only routes and forwards requests,
  including the session credentials, unchanged. It does not enforce
  authentication; the backend validates the session or identity of every
  non-public request, as required by [SPEC-auth.md](SPEC-auth.md). This
  keeps a single enforcement point. AVARC-13 confirmed this.

- **Forwarded headers:** TLS is terminated before the ingress (see
  [SPEC-deployment.md](SPEC-deployment.md)), so the ingress trusts the
  forwarded headers of private-range hops and passes them on unchanged;
  the upstreams see the original scheme and host, which Keycloak needs for
  secure cookies. For a hop that is not trusted, the headers are replaced by
  the values of the connection.

- **Request ID and access log** ([AVARC-24](../tasks/TASK-observability-ingress-database.md),
  conventions in [SPEC-observability.md](SPEC-observability.md)): every
  request gets an ID, sent to the upstreams and back to the client in the
  header `X-Request-Id`. A valid value (8 to 64 characters of letters,
  digits, `.`, `_`, `-`) from a trusted hop is kept; from anywhere else it is
  replaced. The access log is one JSON object per line on standard output
  with the shared fields, the path without the query string (it can carry
  login codes), the status, the sizes and the durations, and never cookies or
  authorization headers. nginx's own error log stays plain text on standard
  error.
- **Metrics:** a second listener on port 8081 serves nginx's `stub_status`
  to the metrics exporter of the Compose project. The port is not
  published, and the public listener does not route to it.

## Open questions

- Caching, compression and rate limiting.
