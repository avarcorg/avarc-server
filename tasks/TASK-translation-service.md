---
id: AVARC-47
type: task
status: open
priority: normal
area: frontend
depends-on: [AVARC-46]
created: 2026-10-15
---

# TASK: External translation service

Spec: [SPEC-frontend.md](../spec/SPEC-frontend.md)

The translations are maintained in an external translation service. The
translation keys of the repository and the translations of the service are
synchronized in both directions: new and removed keys reach the service,
finished translations reach the repository.

This task is a stub. A more detailed specification will follow: the choice
of the service, the direction and trigger of each synchronization, how
secrets are handled, and the check that keys and translations are
complete.

## Acceptance

- To be defined with the detailed specification.
