# SPEC: Releases

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Mark named releases in the source tree, so that a host runs a known,
reproducible version of the application instead of whatever happens to be
checked out.

## Requirements

- A release is an annotated git tag on a commit of `main`.
- Every release has a version and notes saying what changed since the
  previous release.
- A release is created by one script, `tools/release.sh`, which refuses to
  create a release that is not reproducible: the working tree must be clean,
  the branch `main` and in sync with its remote, and the work item check
  must pass.
- A host can tell which release it runs.

## Decisions

- **Version scheme:** semantic versioning, `MAJOR.MINOR.PATCH`. While
  there is no public version, `MAJOR` is 0 and a breaking change raises
  `MINOR`. The first release is `0.1.0`.
- **Tag name:** the version with a leading `v`, for example `v0.1.0`. Only
  tags of this form are releases; the script compares them with a version
  sort and accepts only a version greater than the latest one.
- **Notes:** the message of the annotated tag lists the subjects of the
  commits since the previous release, one per line, which already carry the
  work item IDs (see [SPEC-work-tracking.md](SPEC-work-tracking.md)). There
  is no separate changelog file.
- **Signing:** the tag is signed (`git tag -s`) when `user.signingkey` is
  configured, and only annotated otherwise.
- **Creating a release:** `tools/release.sh <version>` creates the tag
  locally and prints it; `tools/release.sh <version> --push` also pushes the
  tag. Without the push option nothing leaves the machine.
- **Which release a host runs:** a host runs the checkout from which
  `deploy/deploy.sh` was run (see
  [SPEC-deployment.md](SPEC-deployment.md)). Deploying a release means
  checking out its tag there first.
- **Images:** introduced in [AVARC-31](../tasks/finished/TASK-image-builds.md),
  split by module in [AVARC-52](../tasks/finished/TASK-per-module-builds.md). One
  GitHub Actions workflow per module (`ci-backend.yml`, `ci-frontend.yml`,
  `ci-ingress.yml`, `ci-keycloak.yml`) builds and tests that module
  (`./mvnw -Pwith-docker -pl avarc-server-<module> verify`, which builds its
  image) on pushes to `main` and on pull requests that change its directory
  or the shared build files (the root `pom.xml`, the Maven wrapper,
  `tools/publish-images.sh` and the workflow files involved), except
  changes of Markdown files only. The modules do not depend on each other.
  All of them call the reusable workflow `build-module.yml`, which holds the
  steps. A push publishes only the image of the module it built; pull
  requests only build. A release tag is built by the workflow `ci-release.yml`,
  which runs the same steps for all four modules, so a release names a
  consistent set. The publishing logic is the script
  `tools/publish-images.sh`, not the workflow.
  - **Notification:** after a successful build and publishing of a push to
    `main` of this repository (not a pull request, fork or release tag), a
    separate job of the module workflow posts one message with the commit
    and the module name to a chat
    channel through an incoming webhook, the only thing it needs being one
    secret. A listener of the deployment side reads the message as a hint
    only: it checks the registry for new `snapshot` images before it updates
    stage, so a forged message cannot deploy anything that was not
    published. The notification is best effort: without the secret it is
    skipped, and a failure only shows as a warning, so it never fails the
    workflow. The chat server, the listener and how stage is updated are
    not part of this repository.
  - **Registry:** the GitHub Container Registry, namespace
    `ghcr.io/avarcorg`, images `avarc-backend`,
    `avarc-frontend`, `avarc-ingress` and `avarc-keycloak`. The packages are public (the source is), so a host
    pulls without logging in. The workflow logs in
    with its own token, which only pushes may use. The images carry the `org.opencontainers.image.source`
    label of the repository, which links the packages to it.
  - **Tags:** a push to `main` publishes the moving tag `snapshot` and the
    tag `sha-<first seven characters of the commit>` of the images built
    from that commit; the others keep their own latest `snapshot`. A release
    tag `vX.Y.Z` publishes `X.Y.Z` and `latest` of all four. The version in the POMs is not
    the published version: the build tags the images with it locally and
    the script retags them.
  - **Versions and caches:** the Java and Node versions are constants in
    the reusable workflow's `env`; a step fails the build when they differ from the
    POMs. Cached between runs: the Maven repository and the wrapper's Maven
    distribution (by `actions/setup-java`) and npm's downloads (the Node
    container keeps them in a host directory, see `docker-node.sh`). The
    Docker images that the build pulls (the buildpack builders, the Node
    image, the Keycloak base image) and the downloads inside a `pack` build (JRE, Node) are not
    cached: the cache action for Docker images that was tried no longer
    works with GitHub's cache service.
  - **Cleaning images:** introduced in [AVARC-40](../tasks/finished/TASK-clean-images.md).
    The workflow "Clean images" (`.github/workflows/clean-images.yml`) runs
    weekly and on demand with the permission `packages: write` only (the
    four packages are linked to the repository). For each of the four
    images it deletes the versions that carry only `sha-<commit>` tags and
    are older than 30 days, and the untagged versions older than one day
    that no remaining version references (the platform manifests of a
    multi-platform image are found by reading the manifest of each remaining
    version). The newest 5 versions of each image are never deleted. A
    version tagged `snapshot`, `latest` or `X.Y.Z` is never deleted, so
    every release stays pullable. Hosts name `snapshot` or a release tag in
    their secrets file, never a bare `sha-` tag. The days, the number of
    versions to keep and a dry run (lists, deletes nothing) are inputs of
    the manual run.
  - **Cleaning workflow runs:** introduced in [AVARC-39](../tasks/finished/TASK-clean-action-runs.md).
    The workflow "Clean workflow runs" (`.github/workflows/clean-runs.yml`)
    runs weekly and on demand with the permission `actions: write` only. It
    deletes finished runs older than 30 days, but keeps the latest 5 runs of
    every workflow; queued and running runs are never touched. Both values
    and a dry run (lists, deletes nothing) are inputs of the manual run.
    Images, releases and tags are not workflow runs and are not affected.
  - **Using them:** the Compose project runs a published image when
    `IMAGE_NAMESPACE=ghcr.io/avarcorg` and `BACKEND_VERSION`,
    `FRONTEND_VERSION`, `INGRESS_VERSION` and `KEYCLOAK_VERSION` name a tag (see
    [SPEC-deployment.md](SPEC-deployment.md)). Without a registry
    namespace, a host runs images built on itself (`-Pwith-docker`) under the
    default names and versions. Stage runs the published `snapshot` images;
    prod runs release tags only, once it exists. Deploying a host from the
    published images automatically is not decided yet.

## Open questions

- None at the moment.
