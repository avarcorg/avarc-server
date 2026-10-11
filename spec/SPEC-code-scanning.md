# SPEC: Code scanning with CodeQL

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Find security problems and common defects in the code through automated
CodeQL analysis on GitHub.

## Requirements

- CodeQL runs as a GitHub Actions workflow in this repository.
- Languages analyzed: Java/Kotlin, JavaScript/TypeScript, and the GitHub
  Actions workflows themselves, as far as code for them exists.
- It runs on pushes to `main`, on pull requests targeting `main`, and on a
  regular schedule.
- It only analyzes `main` and pull requests into it. Branches that must be
  ignored:
  - historic development branches: `first-attempt`, `main-pre-ory`,
    `main-second-attempt`, `build-nginx-oci-image`,
    `improved-workflow-security`
  - update branches from dependency tooling: `dependabot/**` and
    `renovate/**` (their pull requests into `main` are still analyzed)
- Findings are reported in the repository's code scanning alerts.

## Open questions

- Default setup versus an advanced workflow file.
- Query suite (default versus extended).
- Whether findings block merging.
- Build mode for Java/Kotlin.
