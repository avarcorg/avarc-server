---
id: AVARC-24
type: task
status: open
priority: normal
area: ingress
depends-on: [AVARC-21]
created: 2026-10-12
---

# TASK: Ingress and database observability

Spec: [SPEC-ingress.md](../spec/SPEC-ingress.md) and
[SPEC-deployment.md](../spec/SPEC-deployment.md), with the shared approach
from [AVARC-21](TASK-observability-system.md).

Ingress:

- Access logs in the shared structured format to standard output, without
  session cookies or authorization headers.
- Create the request ID for every incoming request (or accept it only from
  trusted sources) and forward it to all upstreams.
- Expose request metrics; the metrics endpoint is not routed publicly.

Database and deployment:

- Database metrics (connections, size, slow queries) and logging of slow
  statements.
- Health checks for every service of the Compose project, and restart
  behaviour visible in the metrics.
- Container-level resource metrics, and log rotation for the container logs.
- Provide the separate Compose project of the monitoring stack chosen in
  AVARC-21 (own template, user and data directory), optional for the
  developer deployment, and the network on which the application project
  exposes its metrics endpoints.

Done so far: request ID, JSON access log and the metrics listener of the
ingress; log rotation, health checks of all services, the metrics network and
slow-statement logging in the Compose project. The monitoring project
itself (exporters, database and container metrics, dashboards) is set up
outside this repository; what the application provides is in the spec.
