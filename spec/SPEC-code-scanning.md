# SPEC: Code scanning with CodeQL

Status: accepted. Part of [SPEC.md](../SPEC.md).

## Purpose

Find security problems and common defects in the code through automated
CodeQL analysis on GitHub.

## Requirements

- CodeQL runs as a GitHub Actions workflow in this repository.
- Languages analyzed: Java/Kotlin, JavaScript/TypeScript, Python (the
  tools in `tools/`), and the GitHub Actions workflows themselves, as far as
  code for them exists. CodeQL does not support shell scripts; they are not
  covered by it.
- A push or pull request analyzes a language only when its own area has
  changes: the Java/Kotlin analysis for the backend module and the Maven
  files, JavaScript/TypeScript for the frontend module, Python for `*.py`
  files, and the workflows for `.github/workflows/` and `.github/actions/`.
  The weekly schedule, a change of the CodeQL workflow itself and a change
  whose files cannot be determined analyze all languages.
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
  the changed files; only the languages that have source files (the workflow
  files for `actions`, `*.java`/`*.kt` for Java/Kotlin, `*.js`/`*.ts` and
  variants for JavaScript/TypeScript, `*.py` for Python) and changes in
  their area are analyzed; with none, the analysis is skipped.
- Java/Kotlin uses build mode `none`; it needs no build step, which keeps the
  analysis job simple and fast.
- The default query suite is used, for the fewest false positives.
- Findings are reported only: the analysis is not a required check and does
  not block merging.
- A push or pull request that changes only Markdown files does not run the
  analysis (`paths-ignore`); the weekly schedule is not affected.
- Branches are ignored by allow-listing: the push trigger names only
  `main`, so no analysis runs for the branches above.

## Shell scripts

CodeQL does not analyze shell, so the shell scripts are checked with
ShellCheck instead, at the level of warnings and errors (notes, such as
unquoted variables that are safe, are not reported). `tools/shellcheck.sh`
selects the tracked files that start with a shell shebang, except the
third-party `mvnw`, and runs ShellCheck; the workflow
`.github/workflows/shellcheck.yml` calls it on pushes to `main` and pull
requests that change a shell script, the hooks or the workflow itself.

## Workflow lint

CodeQL looks at the workflows for security problems only. Their syntax and
wiring (inputs of actions, `needs:` references, the inputs of reusable
workflows, expressions) are checked with actionlint, introduced in
[AVARC-53](../tasks/TASK-actionlint.md). `tools/actionlint.sh` runs the
installed actionlint or else its container image, whose version is pinned in
the script; the workflow `.github/workflows/actionlint.yml` calls it on pushes
to `main` and pull requests that change a workflow or the script. Any finding
fails the check.

## Java format

The formatting of the backend's Java sources is checked as a code quality
check of its own, next to CodeQL and ShellCheck. The rule and the tool are in
[SPEC-backend.md](SPEC-backend.md). `tools/java-format.sh check` runs the
check without changing a file; the workflow
`.github/workflows/java-format.yml` calls it on pushes to `main` and pull
requests that change a Java file, a POM or the workflow itself. It reports a
failing check, not an alert. The same check is part of the CI build and of the
pre-commit hook when Java files are staged.
