# SPEC: Dependency updates with Renovate

Status: accepted. Part of [SPEC.md](../SPEC.md).

## Purpose

Keep dependencies of all partial applications, container images and CI
workflows up to date through automated pull requests from Renovate.

## Requirements

- Renovate is the only tool opening dependency update pull requests.
  Dependabot version updates are disabled.
- Renovate is the hosted Renovate app, enabled for this repository; nobody
  operates it. It is configured by a `renovate.json` in the repository root,
  based on `config:recommended`, with the Compose template
  `deploy/docker-compose.template` added to the files it scans.
- The Node version, which no standard manager recognises, is tracked by a
  custom manager in `node.version` of the frontend POM and `NODE_VERSION` of
  the CI workflow, and updated in one grouped pull request so the CI check
  between them keeps passing. The Paketo builder images are untagged and
  need no tracking.
- Renovate takes the changelog of an image from the source repository named
  in the image's labels. The Keycloak image names a release mirror there, so
  the source of `quay.io/keycloak/keycloak` is set to
  `https://github.com/keycloak/keycloak`, whose releases carry the notes.
- Pull requests are neither grouped beyond the recommended presets nor
  scheduled or rate limited: they open as soon as an update appears.
- Nothing is merged automatically; every update pull request is reviewed.
- Major updates get their own pull request, labeled `major`. Security updates
  are raised at once, like all others.
- Renovate only operates on the default branch (`main`). It must not use any
  other branch as a base branch.
- Pre-existing branches that must be ignored by Renovate:
  - historic development branches: `first-attempt`, `main-pre-ory`,
    `main-second-attempt`, `build-nginx-oci-image`,
    `improved-workflow-security`
  - leftover update branches from earlier tooling: `dependabot/**` and
    `renovate/**`
- Renovate must not be reconfigured to pick up its own or other tools'
  update branches. The stale `dependabot/**` branches are deleted from the
  remote; `renovate/**` branches belong to Renovate, which manages them.
- Update pull requests follow the contribution rules in
  `AI_POLICY.md` and the sign-off rule from `AGENTS.md` where the Renovate
  deployment allows it.
