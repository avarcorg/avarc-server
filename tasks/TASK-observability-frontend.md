---
id: AVARC-23
type: task
status: open
priority: normal
area: frontend
depends-on: [AVARC-21, AVARC-6]
created: 2026-10-12
---

# TASK: Frontend observability

Spec: [SPEC-frontend.md](../spec/SPEC-frontend.md), with the shared approach
from [AVARC-21](TASK-observability-system.md).

- Structured server-side logs from the Next.js server with the shared fields
  and the request ID.
- A health endpoint for the Compose health check (done: `/health`).
- Server-side metrics (request count and latency, rendering errors).
- Decide whether browser-side errors and basic performance data are
  collected, and if so how, in line with the privacy rules of AVARC-21 and
  without a third-party service by default.
- Pass the request ID on to calls to the backend.
