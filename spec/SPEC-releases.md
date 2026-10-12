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
- **Images:** once the backend and the frontend are built as images, they
  are tagged with the release version and the Compose project refers to
  that version. Until then the Compose project pulls only third-party
  images, which are pinned in the template.

## Open questions

- None at the moment.
