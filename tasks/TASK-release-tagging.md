---
id: AVARC-26
type: task
status: open
priority: normal
area: project
created: 2026-10-12
---

# TASK: Release tagging

Spec: `spec/SPEC-releases.md` (to be created, linked from
[SPEC.md](../SPEC.md))

Mark named releases in the source tree with git tags, so that stage and
production run a known, reproducible version instead of whatever is checked
out.

- Decide the version scheme (for example semantic versioning, or calendar
  versions) and the tag name format.
- Decide who creates a release and how: annotated and signed tags, from
  which branch, and whether a release has notes (a changelog, or the commit
  history since the previous tag).
- Decide how a tag selects what a host runs: the checkout `deploy.sh` is run
  from, and the image versions of the Compose project. Stage follows tags
  too ([AVARC-27](TASK-stage-deployment.md)).
- Provide a small script in `tools/` that creates a release (checks the
  working tree and branch, creates the tag, optionally pushes it), and
  document the procedure in the specification.
- Create the first release tag once the procedure exists.
