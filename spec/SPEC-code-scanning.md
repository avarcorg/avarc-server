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
- It is an advanced workflow file (`.github/workflows/codeql.yml`), not
  GitHub's default setup, so triggers, branches and languages are under
  version control. The default setup must stay disabled.
- It must not fail for lack of code. A first job lists the tracked files and
  only the languages that have source files are analyzed (the workflow files
  for `actions`, `*.java`/`*.kt` for Java/Kotlin, `*.js`/`*.ts` and
  variants for JavaScript/TypeScript); with none, the analysis is skipped.
- Java/Kotlin uses build mode `none`.
- A push or pull request that changes only Markdown files does not run the
  analysis (`paths-ignore`); the weekly schedule is not affected.
- Branches are ignored by allow-listing: the push trigger names only
  `main`, so no analysis runs for the branches above.

## Open questions

- Query suite (default versus extended).
- Whether findings block merging.
- Revisit the language detection, build mode and any build steps once the
  backend and frontend architecture is agreed
  ([AVARC-4](../tasks/finished/TASK-backend-stack-decision.md),
  [AVARC-7](../tasks/finished/TASK-frontend-stack-decision.md)).
