---
id: AVARC-36
type: task
status: open
priority: normal
area: project
depends-on: [AVARC-27, AVARC-31]
created: 2026-10-15
---

# TASK: Notify the deployment system after a successful build

Spec: [SPEC-releases.md](../spec/SPEC-releases.md),
[SPEC-deployment.md](../spec/SPEC-deployment.md)

Today stage is updated by hand ([AVARC-27](TASK-stage-deployment.md)). After
a successful "CI Build" of `main`, the workflow tells a deployment system
that a new commit is ready, and that system updates and restarts stage. This
repository holds only the notification and its description in generic terms;
the deployment system, the network it is reached through, hosts, job names
and credentials are kept in private documentation and never appear in this
repository, its workflows or its documentation.

- Add a job to `.github/workflows/ci-build.yml` that runs only for a push to
  `main` of this repository (not for pull requests, forks or release tags),
  after the build and publishing job succeeded, and sends one request to the
  deployment system with the commit SHA as a parameter.
- The job reaches the deployment system through a private network that the
  runner joins for the duration of the job. Everything it needs comes from
  repository secrets and variables, none of them in the repository:
  - secrets: `DEPLOY_NETWORK_CLIENT_ID`, `DEPLOY_NETWORK_CLIENT_SECRET`
    (the credentials with which the runner joins the private network) and
    `DEPLOY_TRIGGER_TOKEN` (the token of the trigger);
  - variables: `DEPLOY_NETWORK_TAG` and `DEPLOY_TRIGGER_URL` (the URL of
    the trigger, without the token).
  The secrets are created on the deployment side; this task only references
  them by these names.
- Give the job the minimal `permissions`, pin its actions like the others,
  keep the token out of the logs (no `set -x`, no echo of the URL), and let
  a failed notification not fail the build: the build result stays what the
  build says, the notification shows as its own job.
- Keep the specs generic: the releases spec says that a successful build of
  `main` notifies the deployment system, which updates stage; the
  deployment spec says that production is not updated this way. No names,
  addresses or network details.
- The update procedure of [AVARC-27](TASK-stage-deployment.md) points to
  this task; add a line there when it is done. Which steps the deployment
  system runs is its own task in the private documentation. Updates of the
  root-owned parts stay manual (`deploy/deploy.sh`) unless that changes.
- Decide before implementing: a workflow step that joins a private network
  shows in the public repository that such a network is used (the
  secret names, the action). The maintainer accepts that, or the notification
  uses another way that leaves the network out of the public workflow.

## Verification

Lint the workflow with `actionlint`. A push to `main` runs the new job after
the publishing job; a pull request and a release tag do not. With the
deployment side in place (private task): the request arrives with the right
SHA and stage is updated; with a wrong token or an unreachable system the
job fails visibly and the build stays green.
