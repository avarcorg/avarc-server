---
id: AVARC-36
type: task
status: in-progress
priority: low
area: project
depends-on: [AVARC-27, AVARC-31, AVARC-37]
created: 2026-10-15
---

# TASK: Notify the deployment system after a successful build

Spec: [SPEC-releases.md](../spec/SPEC-releases.md),
[SPEC-deployment.md](../spec/SPEC-deployment.md)

Today stage is updated by hand ([AVARC-27](TASK-stage-deployment.md)); since
stage pulls the published images ([AVARC-37](TASK-registry-pull.md)), an
update needs only a pull, restart and check. After a successful "CI Build" of
`main`, the workflow posts the commit to a chat channel, and the deployment
side, which listens there, updates stage. This repository holds only the
post and its description in generic terms; the chat server, the listener,
hosts and credentials are kept in private documentation and never appear in
this repository, its workflows or its documentation.

Decided: the workflow does not join any private network or call a trigger.
It only posts to an incoming webhook of a chat server; the deployment side
makes outbound connections only.

Done in the repository:

- Job `notify-chat` in `.github/workflows/ci-build.yml`: runs only for a
  push to `main` of this repository (not for pull requests, forks or release
  tags), after the build and publishing job succeeded, with no token
  permissions. It posts one message with the commit SHA to the webhook in
  the secret `CHAT_WEBHOOK_URL` (the channel is set in the webhook, not in
  the workflow). No tracing, no echo of the URL. It is best effort and
  never fails the workflow: without the secret it only prints a notice, a
  failing `jq` or `curl` only prints a warning, and the job has
  `continue-on-error`.
- The specs say that a successful build of `main` posts a hint and that the
  deployment side checks the registry before it updates stage.

Left to do (private side, outside this repository):

- Create the webhook and the secret `CHAT_WEBHOOK_URL`. A repository secret
  can be read by any workflow on any branch of the repository; an
  environment secret limited to `main` with a protected `main` is stronger.
- The listener (a daemon with an outbound websocket to the chat server, or
  the deployment system) accepts only messages from the webhook in the one
  channel, and treats them as a hint: it compares the digests of the four
  `snapshot` images in the registry with the deployed ones and updates stage
  only when all four changed, then runs the checks of the deployment spec and
  rolls back to the earlier `sha-<commit>` on failure. A slow poll of the
  same digests covers a missed message.
- The update procedure of [AVARC-27](TASK-stage-deployment.md) points to this
  task; add a line there when it is done. Updates of the root-owned parts
  stay manual (`deploy/deploy.sh`) unless that changes.

## Verification

`actionlint` finds nothing in the workflow. A push to `main` runs the job
after the publishing job; a pull request and a release tag do not. With the
private side in place: the message arrives with the right SHA and stage is
updated; a forged message that does not match new digests changes nothing;
with a wrong webhook URL a warning shows and the workflow stays green;
without the secret the job prints a notice and does nothing.
