---
id: AVARC-2
type: task
status: open
priority: normal
area: project
created: 2026-10-11
---

# TASK: Work tracking

Spec: [SPEC-work-tracking.md](../spec/SPEC-work-tracking.md)

- Implement the index generator producing `tasks/INDEX.md` and the check
  described in the spec, as one Python 3 script in `tools/`.
- Add the pre-commit hook and the GitHub workflow that run the check (a
  duplicate ID is a warning locally and an error in the workflow).
- Adapt the existing task files: add front matter, assign IDs from AVARC-3
  upward, set `status` (finished only for AVARC-1), and fix references.
- Generate and commit the first `tasks/INDEX.md`.
- Update the Tasks section of `AGENTS.md` and the work-tracking link in
  `SPEC.md`.
