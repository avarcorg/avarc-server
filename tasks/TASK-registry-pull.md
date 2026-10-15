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
[AVARC-32](finished/TASK-keycloak-image.md),
[AVARC-33](finished/TASK-ingress-image.md)). Stage runs them since
2026-10-15; the tasks that wait for the rest of this work point here
([AVARC-36](TASK-deploy-notification.md)).

## Done

- The packages are public, so a host pulls without a login.
- `run.sh up` pulls the images first when `IMAGE_NAMESPACE` names a registry,
  with a few retries, and stops with a message when the pull fails, before
  anything is started. It takes `IMAGE_NAMESPACE` and the `*_VERSION`
  variables from the environment's secrets file when the environment does not
  set them, so a host keeps its choice in a file that is never committed and
  needs no change to the systemd unit.
- Stage runs the four images under the tag `snapshot` (decided by the
  maintainer for now; a pinned `sha-<commit>` remains the way to roll back,
  see the deployment spec). The first run found
  that the ingress image failed without a `PORT` variable; its configuration
  now has the port written in ([AVARC-33](finished/TASK-ingress-image.md)).
  After a restart through the deploy job the smoke checks answer as before
  (health 200, API 401 without a login, realm endpoint 200, origin 307), and
  the login and logout work in a browser.
- The specs, `AGENTS.md` and the notes of AVARC-27, 32 and 33 say that stage
  runs the published images.

## Remaining

- Test the update procedure of the deployment spec on stage: a restart pulls
  the new `snapshot`, and a rollback to `sha-<commit>` of an earlier build
  and back to `snapshot` works.
- Check that a missing tag fails with the clear message after the retries.

## Verification

Stage runs all four images from the registry under their published tags, the
routes and the login work as before, and an update to a newer tag and back to
the previous one works.
