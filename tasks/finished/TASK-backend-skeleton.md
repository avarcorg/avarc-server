---
id: AVARC-3
type: task
status: finished
priority: normal
area: backend
depends-on: [AVARC-4]
created: 2026-10-11
---

# TASK: Backend project skeleton

Spec: [SPEC-backend.md](../../spec/SPEC-backend.md)

- Create the backend project with build, a health endpoint and a test.
- Document how to build and run it in `AGENTS.md`.

Done: root parent `pom.xml` with the `avarc-server-backend` module, Maven
wrapper, a hello and health endpoint with tests, and a Paketo image build
(`-Pwith-docker`). Documented in `AGENTS.md`.
