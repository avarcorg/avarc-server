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
- **Images:** introduced in [AVARC-31](../tasks/finished/TASK-image-builds.md). A
  GitHub Actions workflow "CI Build" (`.github/workflows/ci-build.yml`; a
  release build gets a workflow of its own) builds and tests
  the project (`./mvnw -Pwith-docker verify`, which builds all images) on
  every push to `main`, on release tags and on pull requests, except pushes
  and pull requests that change only Markdown files (a release tag always
  builds). Pull requests
  only build. The publishing logic is the script
  `tools/publish-images.sh`, not the workflow.
  - **Registry:** the GitHub Container Registry, namespace
    `ghcr.io/avarcorg`, images `avarc-backend`,
    `avarc-frontend`, `avarc-ingress` and `avarc-keycloak`. The packages are public (the source is), so a host
    pulls without logging in. The workflow logs in
    with its own token, which only pushes may use. The images carry the `org.opencontainers.image.source`
    label of the repository, which links the packages to it.
  - **Tags:** a push to `main` publishes the moving tag `snapshot` and the
    tag `sha-<first seven characters of the commit>`; a release tag
    `vX.Y.Z` publishes `X.Y.Z` and `latest`. The version in the POMs is not
    the published version: the build tags the images with it locally and
    the script retags them.
  - **Versions and caches:** the Java and Node versions are constants in
    the workflow's `env`; a step fails the build when they differ from the
    POMs. Cached between runs: the Maven repository and the wrapper's Maven
    distribution (by `actions/setup-java`) and npm's downloads (the Node
    container keeps them in a host directory, see `docker-node.sh`). The
    Docker images that the build pulls (the buildpack builders, the Node
    image, the Keycloak base image) and the downloads inside a `pack` build (JRE, Node) are not
    cached: the cache action for Docker images that was tried no longer
    works with GitHub's cache service.
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
