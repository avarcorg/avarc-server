#!/bin/sh
# Create a release: an annotated (and, with a signing key, signed) tag
# v<version> on main, with the commit subjects since the previous release as
# its notes. See spec/SPEC-releases.md.
#
#   tools/release.sh <version> [--push]
#
# <version> is MAJOR.MINOR.PATCH, greater than the latest release. Without
# --push nothing leaves the machine.
set -eu

usage () {
    sed -n '2,/^set -eu$/p' "$0" | sed -e '/^set -eu$/d' -e 's/^# \{0,1\}//'
}

VERSION=
PUSH=no
for arg in "$@"
do
    case "${arg}" in
        --push) PUSH=yes ;;
        --help|-h) usage; exit 0 ;;
        -*) echo "release.sh: unknown option ${arg}" >&2; exit 1 ;;
        *) VERSION=${arg} ;;
    esac
done
if [ -z "${VERSION}" ]
then
    usage
    exit 1
fi
if ! printf '%s\n' "${VERSION}" | grep -Eq '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'
then
    echo "release.sh: version must be MAJOR.MINOR.PATCH, not '${VERSION}'" >&2
    exit 1
fi
TAG=v${VERSION}

root=$(git rev-parse --show-toplevel)
cd "${root}"

fail () {
    echo "release.sh: $1" >&2
    exit 1
}

[ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] || fail "not on main"
[ -z "$(git status --porcelain --untracked-files=no)" ] || fail "the working tree has uncommitted changes"
git fetch --quiet origin main
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || fail "main is not in sync with origin/main"
python3 tools/tasks.py check || fail "the work item check failed"
git rev-parse --quiet --verify "refs/tags/${TAG}" > /dev/null && fail "${TAG} already exists"

PREVIOUS=$(git tag --list 'v[0-9]*.[0-9]*.[0-9]*' --sort=-version:refname | head -n 1)
if [ -n "${PREVIOUS}" ]
then
    [ "$(printf '%s\n%s\n' "${PREVIOUS}" "${TAG}" | sort -V | tail -n 1)" = "${TAG}" ] \
        || fail "${TAG} is not greater than ${PREVIOUS}"
    RANGE=${PREVIOUS}..HEAD
else
    RANGE=HEAD
fi

NOTES=$(mktemp)
trap 'rm -f "${NOTES}"' EXIT
{
    echo "Release ${VERSION}"
    echo
    git log --no-merges --format='- %s' "${RANGE}"
} > "${NOTES}"

if [ -n "$(git config --get user.signingkey || true)" ]
then
    git tag -s -F "${NOTES}" "${TAG}"
else
    git tag -a -F "${NOTES}" "${TAG}"
fi
echo "created ${TAG} on $(git rev-parse --short HEAD)"

if [ "${PUSH}" = "yes" ]
then
    git push origin "refs/tags/${TAG}"
fi
