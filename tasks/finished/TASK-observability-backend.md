---
id: AVARC-22
type: task
status: finished
priority: normal
area: backend
depends-on: [AVARC-21, AVARC-3]
created: 2026-10-12
---

# TASK: Backend observability

Spec: [SPEC-backend.md](../../spec/SPEC-backend.md), with the shared approach
from [AVARC-21](../TASK-observability-system.md).

- Structured logs to standard output with the shared fields, including the
  request ID from the ingress and the user id (never tokens or passwords).
- Liveness and readiness endpoints; readiness includes the database. The
  health endpoint stays the only public one (see
  [SPEC-auth.md](../../spec/SPEC-auth.md)).
- Metrics for requests (count, latency, errors by route and status), the
  database connection pool and the JVM; exposed so that they are not
  reachable through the ingress.
- Trace spans for incoming requests and database calls, if AVARC-21 includes
  traces.
- Log audit events for changes to locations (who, what, when), separate from
  the technical logs.

Done: JSON logs with the request ID and the user ID, liveness and readiness
(readiness includes the database), Micrometer metrics, and audit lines for
changes to locations and tag labels, with the actuator on a management port
that the ingress does not route (see SPEC-backend.md). Trace spans are not
part of the first version (SPEC-observability.md).
