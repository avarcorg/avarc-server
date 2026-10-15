---
id: AVARC-31
type: task
status: in-progress
priority: normal
area: project
depends-on: [AVARC-26]
created: 2026-10-15
---

# TASK: Automated image builds and publishing

Spec: [SPEC-releases.md](../spec/SPEC-releases.md),
[SPEC-deployment.md](../spec/SPEC-deployment.md)

GitHub issue: [#380](https://github.com/avarcorg/avarc-server/issues/380)

Build the project automatically on GitHub and publish the container images,
so that hosts can pull a version instead of building it.

Decisions:

- The registry is the GitHub Container Registry, `ghcr.io/avarcorg`; the
  images are `avarc-server-backend` and `avarc-server-frontend` there. The
  packages are public, so hosts pull without credentials.
- Every push to `main` publishes a public snapshot of both images. A
  release tag (`vMAJOR.MINOR.PATCH`, see the releases spec) publishes the
  release version and `latest`.
- Deploying stage from the published images is decided later and is not part
  of this task.

To do:

- A workflow in `.github/workflows/` that builds and tests (`./mvnw verify`)
  on pushes to `main` and on pull requests; the logic stays in the Maven
  build and the scripts, not in the workflow.
- The publishing steps: the `-Pwith-docker` build with `-Dimage.namespace`
  set to the registry namespace, a login with the workflow's own token
  (`packages: write` only where publishing happens), and no publishing for
  pull requests.
- Name the snapshot tag (for example the short commit hash), and keep the
  `BACKEND_VERSION` / `FRONTEND_VERSION` convention of the Compose project
  working with the registry namespace as `IMAGE_NAMESPACE`.
- Specify the result in the releases and deployment specs, and document it
  in `AGENTS.md`.

## Progress

Done: the workflow `.github/workflows/ci-build.yml`, the script
`tools/publish-images.sh`, the source label on the images
(`BP_OCI_SOURCE`), the Java and Node versions as checked constants, the
caches (Maven, the wrapper, npm), the specs and `AGENTS.md`. Checked
locally: the workflow passes `actionlint`, the script's tags for `main`, a release tag and other
refs (`--dry-run`), and both images build with a `ghcr.io/avarcorg`
namespace and carry the label. Found on the way: the Tailwind packages were
runtime dependencies and broke the frontend image build; they are
`devDependencies` now.

First run on GitHub (push to `main`, about five minutes): green, both
images published as `snapshot` and `sha-<commit>`, linked to the
repository. The Maven, wrapper and npm caches were saved; the Docker image
cache action failed against GitHub's cache service and was dropped.

Open: a second run to see the cache hits, setting the two packages to
public (new packages start private; the visibility cannot be changed
through the API), and pulling a published image on a host.
