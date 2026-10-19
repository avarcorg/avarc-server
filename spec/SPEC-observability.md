# SPEC: Observability

Status: draft. Part of [SPEC.md](../SPEC.md). Decided in
[AVARC-21](../tasks/TASK-observability-system.md); implemented by
[AVARC-22](../tasks/finished/TASK-observability-backend.md),
[AVARC-23](../tasks/finished/TASK-observability-frontend.md),
[AVARC-24](../tasks/TASK-observability-ingress-database.md) and
[AVARC-25](../tasks/finished/TASK-observability-identity.md).

## Purpose

Define how the system as a whole is observed, so that every component follows
one approach: which signals exist, the conventions they share, and the
monitoring stack that stores and shows them.

## Requirements

- The application never depends on the monitoring stack. A stopped, broken or
  full monitoring stack costs history, never availability: no service of the
  application project waits for it, health-checks it or writes to it.
- The monitoring stack is self-hosted, runs on a small host and is optional
  for the developer deployment.
- No password, token, session cookie or personal data beyond the user id
  appears in logs, metrics or traces.
- Nothing of the monitoring stack, nor any metrics endpoint, is routed by the
  ingress to the public. The one exception is the backend's actuator
  (`/actuator/`, including `prometheus`) in development and stage, for
  developers; prod never routes it.

## Decisions

### Signals and ambition

- **First public version:** structured logs, health (liveness and readiness),
  metrics, and a request ID through all services.
- **Later:** traces, browser-side telemetry and alert routing. They are not
  part of the first version; the conventions below leave room for them.

### Stack

Compared in AVARC-21: container logs only (no dashboards, no history); a
metrics and log stack (chosen); an OpenTelemetry-based setup (most flexible,
most moving parts, justified only once traces are needed).

- **Components:** Prometheus (metrics), Loki (logs), Grafana (dashboards) and
  Grafana Alloy (log collector).
- **Own Compose project.** The stack is a separate Compose project with its
  own template, secrets and start, stop and upgrade steps. Restarting or
  redeploying the application leaves the history untouched, and the
  application can be released without the stack.
- **Own user and storage.** The stack runs as its own operating-system user
  with its own data directory, so its disk use and retention are managed
  separately from the application's data and backups. The size of the volume
  and the retention are decided when the stack is put on a host.
- **Pull for metrics.** Prometheus scrapes the services; a service that
  Prometheus cannot reach only leaves a gap in the graphs. Nothing is queued
  on the service side.
- **Logs by collection, not by driver.** Services write to standard output and
  Docker keeps the lines with the `json-file` driver and rotation. Alloy reads
  these files, read-only, and pushes them to Loki, labelled by Compose project
  and service. The Loki logging driver is not used: it sits in the write path
  of the container. If Loki is down, Alloy retries and then drops lines; the
  application and `docker logs` are unaffected. The rotation is sized to
  cover an outage that would plausibly be noticed and fixed.
- **Access to the log files, not the Docker socket**, because a read-only
  mount of the socket is still root-equivalent.
- **Network.** The application project declares a Docker network that carries
  only the metrics endpoints. Prometheus joins it; no ports are published.
  The backend and Keycloak serve metrics on a management port that the
  ingress never routes; the ingress and the database get an exporter beside
  them.
- **Access.** Grafana is reached over the private network like the other
  administration tools, with its own admin account in the stack's secrets
  file. Prometheus and Loki are not reachable from outside the host.
- **Developer deployment:** the stack is not part of it; a developer starts it
  by hand if wanted.

### Shared conventions

- **Log format:** one JSON object per line on standard output, with the fields
  `timestamp` (UTC, ISO 8601), `level`, `service`, `request_id`, `user_id`
  (when known) and `message`. Further fields are free.
- **Exceptions:** a component whose own error log cannot be JSON (nginx)
  writes it as plain text to standard error; the collector keeps the lines.
  Keycloak writes JSON with its own field names and no request ID (see
  [SPEC-auth.md](SPEC-auth.md)); the collector adds the service.
- **Levels:** `ERROR`, `WARN`, `INFO`, `DEBUG`. `INFO` in stage and prod,
  `DEBUG` allowed in dev.
- **Request ID:** the ingress creates it for every request in the header
  `X-Request-Id`, replacing any value from outside unless the hop is trusted
  (as for the forwarded headers, see [SPEC-ingress.md](SPEC-ingress.md)). The
  frontend passes it on to the backend, and all services log it.
- **Health:** every service has a health endpoint for the Compose health
  check, which answers with the status only (no data). Where a service
  distinguishes liveness and readiness, the check uses readiness, and
  readiness includes the dependencies a service cannot work without (the
  backend: the database). The health checks of the application project never
  depend on the monitoring stack.
- **Audit events** (who changed which location, when) are written separately
  from the technical logs: lines of the logger `audit` with the field
  `audit=true`, so that the collector can keep them longer than the technical
  logs. They are not stored in the database in the first version; a table is
  the next step if log retention turns out not to be enough
  ([AVARC-22](../tasks/finished/TASK-observability-backend.md)).
- **Identity provider events** (logins, failed logins, lockouts, admin
  changes) are kept in Keycloak's event store, not in the logs, and counted in
  its metrics ([AVARC-25](../tasks/finished/TASK-observability-identity.md)).
- **Retention:** short for logs and metrics, decided with the volume size; the
  audit events follow their own rule.
- **Viewers and alerts:** admins only, through Grafana. No alert routing in
  the first version; failed logins and lockouts raise no alert for now
  (decided in AVARC-25).

## Open questions

- Retention periods and volume size.
- Whether the stack gets its own deploy script and systemd units.
