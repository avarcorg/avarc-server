---
id: AVARC-27
type: task
status: open
priority: normal
area: project
depends-on: [AVARC-18, AVARC-20, AVARC-26]
created: 2026-10-12
---

# TASK: Stage deployment

Spec: [SPEC-deployment.md](../spec/SPEC-deployment.md)

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
  copy, or a symlink): `run.sh` finds the Compose template, Caddyfile,
  Keycloak start script and realm import next to itself, so all of them must
  be there, and an update must replace them together.
- Create the stage secrets file (named in
  [SPEC-deployment.md](../spec/SPEC-deployment.md)) there from the secrets
  the deployment needs, including the initial admin account, with mode 0600
  and never committed.
- Install and enable `deploy/systemd/avarc-stage.service`; check that it starts at
  boot, restarts on failure and stops cleanly.
- Check the addresses: the host must be in the tailnet, docktail must run,
  and the public origin and the admin console address derived from the
  tailnet domain must serve the application (`avarc-stage`) and the Keycloak
  console (`avarc-stage-kc`).
- Run `deploy/accounts.sh --stage` for the first accounts and sign in at the
  console to confirm.
- Verify the ingress rules on the real addresses: realm endpoints answer,
  everything else under `/auth/` does not.

Ongoing:

- Add the backend and the frontend to stage when their services exist.
- Define the update procedure (pull, restart, check) and, if wanted, a
  rollback.
- Decide how often stage is updated and from which branch or tag.
- Back up and restore the database and the Keycloak realm; test a restore.
- Evaluate the capacity of the host, which also informs the production
  host.
- Apply the observability tasks (AVARC-21 and its follow-ups) to stage first.
- Keep this list current when stage reveals problems that dev does not.

## Progress

- 2026-10-12: Initial setup done on the staging host. The old deployment
  was archived to `/home/avarc-stage/legacy/`; `deploy/deploy.sh stage`
  installs the files and `deploy/systemd/avarc-stage.service`; the stage
  secrets file was created; the service runs the ingress, database and
  Keycloak. Still to check from the initial list: boot, restart and stop
  behaviour, the addresses and ingress rules, the first accounts. Updates by
  release tag wait for [AVARC-26](finished/TASK-release-tagging.md).
