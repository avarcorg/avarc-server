---
id: AVARC-18
type: task
status: open
priority: normal
area: project
depends-on: [AVARC-3, AVARC-6, AVARC-8]
created: 2026-10-11
---

# TASK: Deployment setup

Spec: [SPEC.md](../SPEC.md)

Set up a first deployment, intended for developers.

- Run the whole application as a Docker Compose project: ingress, frontend,
  backend, Ory and the database.
- Define how the project is started and stopped.
- Define how configuration and secrets are injected as variables, without
  committing secrets.
- Make the first deployment suitable for developers: easy to bring up and
  reset, with local data.
- Record the deployment decisions in the spec (deployment target and
  environments are open in `SPEC.md`) and update the architecture diagram if
  an architecture decision results from it.
- Document how to use it.
