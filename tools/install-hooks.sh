#!/bin/sh
# Install the pre-commit hook into .git/hooks (not core.hooksPath, which may
# point at a shared directory); a global hook may chain to it.
set -eu
root=$(git rev-parse --show-toplevel)
hook="$(git rev-parse --git-dir)/hooks/pre-commit"
mkdir -p "$(dirname "$hook")"
ln -sf "$root/tools/hooks/pre-commit" "$hook"
echo "installed $hook"
