#!/bin/sh
# Lints the GitHub Actions workflows with actionlint. See
# spec/SPEC-code-scanning.md.
#
#   tools/actionlint.sh [actionlint options]
#
# Uses the installed actionlint, or else its container image (the version is
# pinned below).
set -eu

IMAGE=rhysd/actionlint:1.7.12

cd "$(git rev-parse --show-toplevel)"
if command -v actionlint > /dev/null
then
    exec actionlint "$@"
fi
exec docker run --rm -v "${PWD}:/mnt" -w /mnt "${IMAGE}" "$@"
