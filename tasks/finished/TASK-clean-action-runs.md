---
id: AVARC-39
type: task
status: finished
priority: low
area: project
depends-on: []
created: 2026-10-15
---

# TASK: Clean old workflow runs

Old GitHub Actions workflow runs (CI Build, CodeQL, ShellCheck, task check)
pile up in the repository, with their logs and artifacts. A scheduled workflow
deletes the ones that are no longer useful.

## Suggested implementation

The cleaning is a GitHub Action itself: a workflow that does all of it in
its own steps, with no script under `tools/` and nothing run outside GitHub.

- **Workflow:** `.github/workflows/clean-runs.yml`, started by a weekly
  `schedule` and by `workflow_dispatch`, with the minimal permission
  `actions: write` and nothing else.
- **Steps:** the job uses the `gh` CLI that the runner provides, with the
  workflow's `GITHUB_TOKEN`, to list the runs of the repository and delete
  the selected ones, or a maintained cleanup action pinned to a commit
  (as the other workflows pin theirs), whichever is simpler to keep.
- **Retention:** delete runs older than a number of days (start with 30)
  and keep at least the latest few runs of each workflow, so the last
  result of every workflow stays available. Both values are inputs of the
  manual run and have defaults.
- **Only finished runs:** never delete runs that are queued or in progress.
- **Dry run:** a manual-run input lists what would be deleted and deletes
  nothing.
- **Not touched:** published images, releases and tags are not workflow
  runs; the job must not affect them.

## Acceptance

- A dry run lists the runs it would delete and deletes nothing.
- A real run removes runs older than the retention, keeps the latest runs
  of every workflow and leaves running ones alone.
- The retention is documented in the spec of the releases or the CI build,
  in one place.
