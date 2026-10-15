---
id: AVARC-16
type: task
status: finished
priority: normal
area: code-scanning
depends-on: [AVARC-3, AVARC-4, AVARC-6, AVARC-7]
created: 2026-10-11
---

# TASK: Set up CodeQL

Spec: [SPEC-code-scanning.md](../../spec/SPEC-code-scanning.md)

- Done: an advanced workflow, `.github/workflows/codeql.yml`, restricted to
  `main` and pull requests targeting `main`. It detects which languages
  have source files and skips the others, so it does not fail while no
  code exists (decisions in the spec).
- Disable GitHub's CodeQL default setup in the repository settings, if
  enabled, as it conflicts with the advanced workflow.
- Revisit the workflow once the backend and frontend architecture is agreed
  ([AVARC-4](TASK-backend-stack-decision.md),
  [AVARC-7](TASK-frontend-stack-decision.md)): language detection, build
  mode (and build steps if `none` is not enough) and the query suite.
- Make sure the branches listed in the spec are ignored, and verify no
  analysis runs for them.
- Decide whether findings block merging, and record it in the spec.
- Update `spec/SPEC-code-scanning.md` with the decisions.
- Done: GitHub's default setup is `not-configured`; the stacks are agreed,
  so language detection stays and build mode `none` is kept; the default
  query suite is used; findings do not block merging. A check of the run
  history shows analyses only for pushes to `main` and pull requests
  into it. Decisions are in the spec.
