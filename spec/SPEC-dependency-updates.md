# SPEC: Dependency updates with Renovate

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Keep dependencies of all partial applications, container images and CI
workflows up to date through automated pull requests from Renovate.

## Requirements

- Renovate is the only tool opening dependency update pull requests.
  Dependabot version updates are disabled.
- Renovate is configured by a `renovate.json` in the repository root.
- Renovate only operates on the default branch (`main`). It must not use any
  other branch as a base branch.
- Pre-existing branches that must be ignored by Renovate:
  - historic development branches: `first-attempt`, `main-pre-ory`,
    `main-second-attempt`, `build-nginx-oci-image`,
    `improved-workflow-security`
  - leftover update branches from earlier tooling: `dependabot/**` and
    `renovate/**`
- Renovate must not be reconfigured to pick up its own or other tools'
  update branches; stale ones are deleted from the remote instead (see
  [TASK-renovate-setup.md](../tasks/TASK-renovate-setup.md)).
- Update pull requests follow the contribution rules in
  `AI_POLICY.md` and the sign-off rule from `AGENTS.md` where the Renovate
  deployment allows it.

## Open questions

- Which Renovate deployment is used (hosted app or self-hosted) and who
  operates it.
- Grouping, scheduling, rate limits and automerge policy.
- Handling of major updates and security updates.
- Whether stale historic branches are deleted or merely ignored.
