---
id: AVARC-25
type: task
status: open
priority: normal
area: auth
depends-on: [AVARC-21, AVARC-20]
created: 2026-10-12
---

# TASK: Identity provider observability

Spec: [SPEC-auth.md](../spec/SPEC-auth.md), with the shared approach from
[AVARC-21](TASK-observability-system.md).

- Keycloak logs in the shared structured format with the request ID, and the
  log level appropriate for each environment.
- Enable its metrics and health endpoints on the management port, which the
  ingress never routes (see [SPEC-auth.md](../spec/SPEC-auth.md)), and use
  the readiness endpoint for alerts and dashboards.
- Enable event logging for logins, failed logins and brute-force lockouts,
  and for admin actions (user, role and password changes), with a
  retention that fits AVARC-21, and make them available to whoever looks at
  the logs.
- Decide whether failed-login and lockout counts raise an alert.
