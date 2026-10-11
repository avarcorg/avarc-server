---
id: AVARC-17
type: task
status: open
priority: normal
area: project
created: 2026-10-11
---

# TASK: Developer setup

Spec: [SPEC-work-tracking.md](../spec/SPEC-work-tracking.md)

Provide a single entry point that prepares a fresh clone for development.

- Write `spec/SPEC-dev-setup.md` with the requirements and link it from
  `SPEC.md`; record the decisions there.
- Add a setup script in `tools/` that runs the one-time steps for a clone.
  It includes `tools/install-hooks.sh` (the work-item pre-commit check) and
  is safe to run repeatedly.
- Have it report missing prerequisites (for example `python3`, `git`)
  instead of failing obscurely.
- Extend it with the toolchain steps of the backend and frontend skeletons
  once those exist.
- Document the setup in `README.md` and point to it from `AGENTS.md`.
