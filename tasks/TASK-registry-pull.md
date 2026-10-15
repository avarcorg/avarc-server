---
id: AVARC-37
type: task
status: open
priority: normal
area: project
depends-on: [AVARC-31, AVARC-32, AVARC-33]
created: 2026-10-15
---

# TASK: Run the published images on stage

Spec: [SPEC-releases.md](../spec/SPEC-releases.md),
[SPEC-deployment.md](../spec/SPEC-deployment.md)

The CI Build publishes the backend, frontend, ingress and Keycloak images to
the GitHub Container Registry ([AVARC-31](finished/TASK-image-builds.md),
[AVARC-32](finished/TASK-keycloak-image.md), [AVARC-33](finished/TASK-ingress-image.md)). Stage
does not pull them yet: it runs images built on its own host. Pulling from the
registry has been postponed by the maintainer; this task is the work to do
when it is taken up, and the tasks that wait for it point here
([AVARC-36](TASK-deploy-notification.md)).

- The environment pulls the images from the registry: it pulls without a login (the
  packages are public since 2026-10-15), and runs the Compose
  project with `IMAGE_NAMESPACE=ghcr.io/avarcorg` and the four `*_VERSION`
  variables naming a published tag (`snapshot`, `sha-<commit>` or a release
  version).
- `run.sh` already takes `IMAGE_NAMESPACE` and the `*_VERSION` variables from
  the environment's secrets file when the environment does not set them, so a
  host keeps its choice in a file that is never committed and needs no change
  to the systemd unit.
- Decide which tag stage runs (the moving `snapshot`, or a pinned
  `sha-<commit>`), and how the update procedure of
  [AVARC-27](TASK-stage-deployment.md) changes: pull, restart, check, and a
  rollback to the previous tag.
- Make sure `deploy/run.sh` and the Compose template need no change besides
  the variables, or specify the change; a missing tag or an expired token
  must fail with a clear message, before the old stack is stopped.
- Update the specs (releases and deployment: the sentence that stage and prod
  run host-built images until then goes away) and `AGENTS.md`, and remove the
  related notes from [AVARC-32](finished/TASK-keycloak-image.md),
  [AVARC-33](finished/TASK-ingress-image.md) and AVARC-27.

## Progress

- 2026-10-15: Stage runs the backend, frontend, ingress and Keycloak images
  from the registry under the tag `snapshot`; the packages were made public
  and `run.sh` pulls (with retries) before the start and takes the namespace
  and versions from the secrets file. The first run found that the ingress
  image failed without a `PORT` variable; its configuration now has the port
  written in ([AVARC-33](finished/TASK-ingress-image.md)). After the restart through
  the deploy job the smoke checks answer as before (health 200, API 401 without
  a login, realm endpoint 200, origin 307). Open: the choice between
  `snapshot` and a pinned `sha-<commit>`, the update and rollback procedure
  with a test of going to a newer tag and back, and the login in a browser.

## Verification

Stage runs all four images from the registry under their published tags, the
routes and the login work as before, and an update to a newer tag and back to
the previous one works.
