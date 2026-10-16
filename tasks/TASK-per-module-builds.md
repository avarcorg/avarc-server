---
id: AVARC-52
type: task
status: in-progress
priority: normal
area: project
depends-on: [AVARC-31]
created: 2026-10-16
---

# TASK: Build and publish per module

Spec: [SPEC-releases.md](../spec/SPEC-releases.md)

The workflow "CI Build" ([AVARC-31](finished/TASK-image-builds.md)) builds
and tests all four modules and publishes all four images on every push to
`main` that changes anything but Markdown, so a change of the ingress
configuration rebuilds the backend, runs its tests and republishes images that
did not change (about five minutes, and new `sha-` versions for nothing).
Split the build by module, so that a push builds, tests and publishes only
what its changed paths belong to.

## Approach

- **One workflow per module:** `ci-backend.yml`, `ci-frontend.yml`,
  `ci-ingress.yml`, `ci-keycloak.yml`, each triggered by the paths of its
  module (`avarc-server-<module>/**`) plus the shared build files (the root
  `pom.xml`, `mvnw` and `.mvn/`, the workflow itself, `tools/publish-images.sh`).
  Each builds only its module (`./mvnw -pl avarc-server-<module> -Pwith-docker
  verify`; the modules do not depend on each other) and publishes only the
  image that it built. To avoid four copies of the steps, they call one
  reusable workflow (`workflow_call`) with the module name as input; the
  logic stays in the Maven build and the scripts.
- **Shared files:** a change of the root `pom.xml` or the wrapper rebuilds
  every module (it is in every path list). Changes of `deploy/`, `spec/`,
  `tasks/` and the other workflows build nothing, as Markdown does not today.
- **Publishing:** `tools/publish-images.sh` takes the module(s) to publish
  (`--module backend`, repeatable) instead of the fixed list of four. A push
  to `main` publishes `snapshot` and `sha-<commit>` of the built image
  only; the other images keep their own latest `snapshot`, which is still
  correct for them because they did not change. `sha-<commit>` therefore
  exists only for the images built from that commit.
- **Releases:** a release tag (`vX.Y.Z`) builds and publishes all four
  images in one run, so that a release version names a consistent set; the
  tag trigger is the same in every module workflow or one `release` workflow
  that calls the reusable one four times. Decide which when writing it.
- **Pull requests:** the module workflows run for the paths a pull request
  changes, build only and do not publish, as now. No branch protection is set
  today, so a skipped, path-filtered workflow blocks nothing; if required
  checks are added later, a path-filtered workflow must be replaced by a
  job that always reports.
- **Notification:** `notify-chat` must not post once per module for one
  push. Decide between one post per module build ("backend built and
  published") or a separate workflow that reports after all module workflows
  of the commit finished (`workflow_run`); the first is simpler. The
  deployment side only needs to learn that something new is published.
- **Cleaning images:** the cleaning rules keep the newest 5 versions of each
  image, which now span more commits for a rarely changed image. Check that
  `snapshot` and `latest` of an image that was not rebuilt for a long time are
  never deleted, and adjust the text if the rule of 30 days needs a second
  look for them.
- **Checks that stay global:** the Java version check against the POMs
  moves into the backend and frontend workflows (each checks its own
  constant); the work item check, formatting, ShellCheck and CodeQL keep
  their own workflows.

## Progress

Decided as proposed: one post per module build (the message names the module
after the commit), one `ci-release.yml` that runs the reusable workflow four
times for a release tag. The cleaning rules need no change: a version tagged
`snapshot`, `latest` or `X.Y.Z` is never deleted, so the image of a rarely
changed module stays pullable. Written: `build-module.yml` (reusable, was
`ci-build.yml`), the four module workflows, `ci-release.yml`, the `--module`
option of `tools/publish-images.sh`, the Renovate file match, the specs and
`AGENTS.md`. The workflows pass `actionlint`. Still to check on GitHub: see
Verification.

## Remaining (as planned originally)

- Write the reusable workflow and the four caller workflows (or the release
  variant), remove `ci-build.yml`, and update the badge in `README.md`, the
  Renovate file match and every reference to "CI Build" in the specs and
  `AGENTS.md`.
- Change `tools/publish-images.sh` and its dry run.
- Update [SPEC-releases.md](../spec/SPEC-releases.md) (the "Images",
  "Notification" and "Tags" decisions) and `AGENTS.md`.
- Check on GitHub: a push that changes only the ingress builds and publishes
  only the ingress; a change of the root `pom.xml` builds all four; a release
  tag publishes all four; a pull request publishes nothing.

## Verification

Four pushes, each touching one module only, show exactly one module run and
one new `sha-` version in the registry for that module's image; the
`snapshot` of the other three images is unchanged. A test tag publishes all
four with the release version and `latest`.
