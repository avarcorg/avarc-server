---
id: AVARC-27
type: task
status: finished
priority: normal
area: project
depends-on: [AVARC-18, AVARC-20, AVARC-26]
created: 2026-10-12
---

# TASK: Stage deployment

Spec: [SPEC-deployment.md](../../spec/SPEC-deployment.md)

Run the application continuously on the staging host, as its own environment
next to dev. This is a long-running task: it stays `open`, and moves to
`in-progress` whenever a piece is being worked on, then back. It is finished
only when stage runs the complete application and updates to it are routine.
Progress is logged below, newest first.

Initial setup (what exists on the host today, with Keycloak and the
database):

- Create the user and group `avarc-stage` and its home directory
  `/home/avarc-stage`, as the systemd unit expects, with access to Docker.
- Decide how the files of `deploy/` get to that directory (a checkout, a
  copy, or a symlink): `run.sh` finds the Compose template
  next to itself, so it must be there, and an update must replace them
  together.
- Create the stage secrets file (named in
  [SPEC-deployment.md](../../spec/SPEC-deployment.md)) there from the secrets
  the deployment needs, including the initial admin account, with mode 0600
  and never committed.
- Install and enable `deploy/systemd/avarc-stage.service`; check that it starts at
  boot, restarts on failure and stops cleanly.
- Check the addresses: the public origin and the admin console address
  (see [SPEC-deployment.md](../../spec/SPEC-deployment.md)) must serve the
  application and the Keycloak console.
- Run `deploy/create-admin-user.sh --stage` for the first accounts and sign in at the
  console to confirm.
- Verify the ingress rules on the real addresses: realm endpoints answer,
  everything else under `/auth/` does not.

Ongoing:

- The update procedure (restart pulls `snapshot`, check, rollback to a
  `sha-<commit>`) is in the deployment spec; its test is in
  [AVARC-37](TASK-registry-pull.md).
- Stage runs the published images since 2026-10-15; what remains of it is in
  [AVARC-37](TASK-registry-pull.md). The automatic update after a build
  ([AVARC-36](../TASK-deploy-notification.md)) follows it.
- Decide how often stage is updated and from which branch or tag.
- Back up and restore the database and the Keycloak realm; test a restore.
- Evaluate the capacity of the host, which also informs the production
  host.
- Exercise Keycloak login and logout on the https origin of stage and, later,
  prod (carried over from
  [AVARC-20](TASK-keycloak-integration.md)).
- Apply the observability tasks (AVARC-21 and its follow-ups) to stage first.
- Keep this list current when stage reveals problems that dev does not.

## Progress

- 2026-10-18: Closed by the maintainer. Stage runs the complete application
  from the published images and updates through the deploy job. Not done and
  not tracked further here: tests of the unit's boot, restart and stop
  behaviour, the update cadence, capacity of the host, and applying the
  observability tasks (AVARC-21 and its follow-ups) to stage. The backup and
  restore are covered by [AVARC-48](TASK-database-backup.md).

- 2026-10-15: Stage runs the complete application: ingress, backend,
  frontend, Keycloak and database, all from the images built on the host (the
  registry pull followed the same day, see above). Checked on the real addresses: the
  application page, the API (401 without a login), the health endpoint, the
  realm endpoints (answer), and the admin console and the `master` realm
  through the ingress (404); login and logout work; the API description and
  Swagger UI are served ([AVARC-34](TASK-api-docs.md)). Still open
  from the lists above: boot, restart and stop behaviour of the unit, the
  update procedure and cadence, backup and restore, capacity,
  observability. After an update the file `VERSION` on the host shows the
  version of the last `deploy/deploy.sh` run, not of the images.
- 2026-10-12: Initial setup done on the staging host. The old deployment
  was archived to `/home/avarc-stage/legacy/`; `deploy/deploy.sh stage`
  installs the files and `deploy/systemd/avarc-stage.service`; the stage
  secrets file was created; the service runs the ingress, database and
  Keycloak. Still to check from the initial list: boot, restart and stop
  behaviour, the addresses and ingress rules, the first accounts. Updates by
  release tag wait for [AVARC-26](TASK-release-tagging.md).
