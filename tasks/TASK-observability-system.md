---
id: AVARC-21
type: decision
status: in-progress
priority: normal
area: project
depends-on: [AVARC-18]
created: 2026-10-12
---

# TASK: Observability of the overall system

Spec: `spec/SPEC-observability.md` (to be created, linked from
[SPEC.md](../SPEC.md))

Decide and specify how the system as a whole is observed, so that the
per-component tasks ([AVARC-22](finished/TASK-observability-backend.md),
[AVARC-23](finished/TASK-observability-frontend.md),
[AVARC-24](TASK-observability-ingress-database.md),
[AVARC-25](finished/TASK-observability-identity.md)) implement one shared approach
instead of each inventing its own.

- Decide the signals that are in scope (logs, metrics, traces, health) and
  the level of ambition for the first public version versus later.
- Decide the stack, with advantages and disadvantages: container logs only,
  a metrics and log stack in the Compose project, or an OpenTelemetry-based
  setup. It must fit the Compose deployment, run self-hosted on a small
  host and stay optional for the developer deployment.
- Define the shared conventions: structured (JSON) logs on standard output,
  a request ID created at the ingress and carried through frontend, backend
  and identity provider into every log line, common field names, log
  levels, and the time format (UTC, see [SPEC.md](../SPEC.md)).
- Define health: a liveness and a readiness endpoint per service, and which
  of them the Compose health checks use.
- Define what must never appear in logs, metrics or traces (passwords,
  tokens, session cookies, personal data beyond the user id).
- Decide retention, who looks at the data and how (dashboards), and whether
  and where alerts are sent.
- Decide how the observability services are reached; they are not routed
  by the ingress to the public.
- Create `spec/SPEC-observability.md`, link it from `SPEC.md`, and update
  the architecture diagram and the deployment spec in the same change.
