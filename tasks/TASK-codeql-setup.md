---
id: AVARC-16
type: task
status: open
priority: normal
area: code-scanning
depends-on: [AVARC-3, AVARC-6]
created: 2026-10-11
---

# TASK: Set up CodeQL

Spec: [SPEC-code-scanning.md](../spec/SPEC-code-scanning.md)

- Decide between GitHub default setup and an advanced workflow file.
- Add the workflow with the languages and triggers from the spec, restricted
  to `main` and pull requests targeting `main`.
- Make sure the branches listed in the spec are ignored, and verify no
  analysis runs for them.
- Decide whether findings block merging, and record it in the spec.
- Update `spec/SPEC-code-scanning.md` with the decisions.
