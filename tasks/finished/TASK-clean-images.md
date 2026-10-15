---
id: AVARC-40
type: task
status: finished
priority: low
area: project
depends-on: [AVARC-31]
created: 2026-10-15
---

# TASK: Clean old container images

Spec: [SPEC-releases.md](../../spec/SPEC-releases.md)

Every push to `main` publishes the backend, frontend, ingress and Keycloak
images to the GitHub Container Registry as `snapshot` and `sha-<commit>`
([AVARC-31](TASK-image-builds.md)). The `sha-` versions pile up
without end. A scheduled workflow deletes the ones that are no longer
useful.

## Suggested implementation

The cleaning is a GitHub Action itself: a workflow that does all of it in
its own steps, with no script under `tools/` and nothing run outside GitHub.

- **Workflow:** `.github/workflows/clean-images.yml`, started by a weekly
  `schedule` and by `workflow_dispatch`, with the minimal permission
  `packages: write` and nothing else. Check whether the packages must be
  linked to the repository for the workflow token to be allowed to delete
  their versions.
- **Steps:** the job deletes package versions of the four images with the
  `gh` CLI that the runner provides (the packages API of the organization),
  or with a maintained cleanup action pinned to a commit (as the other
  workflows pin theirs), whichever is simpler to keep.
- **What goes:** versions that carry only `sha-<commit>` tags and are older
  than a number of days (start with 30), keeping at least the latest few of
  each image; and untagged versions, such as the layers left behind when
  `snapshot` moves. Both values are inputs of the manual run and have
  defaults.
- **What stays:** versions tagged `snapshot`, `latest` or `X.Y.Z`, so every
  release stays pullable, and any version a running host may still use. The
  version tags that hosts keep in their secrets file are release tags or
  `snapshot`, never a bare `sha-` tag, which the spec states in one
  sentence.
- **Multi-architecture images:** deleting a tagged index must not leave its
  platform manifests untagged and then removed while still referenced; the
  job removes untagged versions only when no remaining version references
  them, or uses an action that handles this.
- **Dry run:** a manual-run input lists what would be deleted and deletes
  nothing.

## Acceptance

- A dry run lists the versions it would delete and deletes nothing.
- A real run removes old `sha-` and unreferenced untagged versions, keeps
  `snapshot`, `latest` and all release tags of all four images, and every
  kept image can still be pulled.
- The retention is documented in the spec of the releases, in one place.
