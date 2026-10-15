#!/bin/sh
# Checks the shell scripts of the repository with ShellCheck: every tracked
# file that starts with a shell shebang, except the wrapper `mvnw`, which is
# third-party. See spec/SPEC-code-scanning.md.
#
#   tools/shellcheck.sh [shellcheck options]
#
# Reports warnings and errors by default. Uses the installed shellcheck, or
# else its container image.
set -eu

cd "$(git rev-parse --show-toplevel)"
FILES=$(git ls-files -z | xargs -0 grep -lI '^#!.*\(sh\|bash\)\b' | grep -v '^mvnw$')

if [ $# -eq 0 ]
then
    set -- --severity=warning
fi
if command -v shellcheck > /dev/null
then
    # shellcheck disable=SC2086
    exec shellcheck "$@" ${FILES}
fi
# shellcheck disable=SC2086
exec docker run --rm -v "${PWD}:/mnt" -w /mnt koalaman/shellcheck:stable "$@" ${FILES}
