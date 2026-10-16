---
id: AVARC-53
type: task
status: finished
priority: normal
area: project
created: 2026-10-16
---

# TASK: Lint the workflows with actionlint

Spec: [SPEC-code-scanning.md](../../spec/SPEC-code-scanning.md)

CodeQL analyzes the workflow files for security problems only, not for
mistakes such as a wrong input of an action, a `needs:` that names no job, or
a reusable workflow called with the wrong inputs. actionlint finds those; so
far it was run by hand while writing the per-module workflows
([AVARC-52](TASK-per-module-builds.md)). Run it on GitHub and locally
like ShellCheck.

## To do

- `tools/actionlint.sh`: runs the installed `actionlint`, or else its pinned
  container image, on the workflow files.
- The workflow `.github/workflows/actionlint.yml`, on pushes to `main` and
  pull requests that change a workflow, calling the script.
- A README badge, the section in `SPEC-code-scanning.md` and a line in
  `AGENTS.md`.

## Verification

The workflow passes on `main`, and fails on a pull request with a deliberate
mistake (checked locally with a copy of a workflow that has a `needs:` on a
missing job).

Done: the workflow passes on `main` (the push that added it). The deliberate
mistake (a `needs:` on a missing job, in a copy of a workflow) fails the script
with `job-needs`.
