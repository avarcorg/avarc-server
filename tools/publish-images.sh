#!/bin/sh
# Tags the images built by `./mvnw -Pwith-docker package` for the registry
# and pushes them. See spec/SPEC-releases.md.
#
#   tools/publish-images.sh [--dry-run] <namespace> <git-ref> <commit>
#
# <namespace> is the registry namespace the images were built with
# (-Dimage.namespace), for example ghcr.io/avarcorg. The tags follow from the
# ref: refs/tags/vX.Y.Z publishes X.Y.Z and latest, refs/heads/main publishes
# snapshot and sha-<first seven characters of the commit>; any other ref
# publishes nothing and fails. The login to the registry is done by the
# caller. With --dry-run the commands are printed, not run.
set -eu

usage () {
    sed -n '2,/^set -eu$/p' "$0" | sed -e '/^set -eu$/d' -e 's/^# \{0,1\}//'
}

RUN=
ARGS=
for arg in "$@"
do
    case "${arg}" in
        --dry-run) RUN="echo" ;;
        --help|-h) usage; exit 0 ;;
        -*) echo "publish-images.sh: unknown option ${arg}" >&2; exit 1 ;;
        *) ARGS="${ARGS} ${arg}" ;;
    esac
done
# shellcheck disable=SC2086
set -- ${ARGS}
if [ $# -ne 3 ]
then
    usage
    exit 1
fi
NAMESPACE=$1
REF=$2
COMMIT=$3

case "${REF}" in
    refs/tags/v[0-9]*.[0-9]*.[0-9]*)
        VERSION=${REF#refs/tags/v}
        if ! printf '%s\n' "${VERSION}" | grep -Eq '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'
        then
            echo "publish-images.sh: ${REF} is not a release tag" >&2
            exit 1
        fi
        TAGS="${VERSION} latest" ;;
    refs/heads/main)
        TAGS="snapshot sha-$(printf '%s' "${COMMIT}" | cut -c1-7)" ;;
    *)
        echo "publish-images.sh: nothing to publish for ${REF}" >&2
        exit 1 ;;
esac

cd "$(git rev-parse --show-toplevel)"
BUILT=$(./mvnw -q help:evaluate -Dexpression=project.version -DforceStdout)

for name in avarc-backend avarc-frontend avarc-keycloak
do
    for tag in ${TAGS}
    do
        ${RUN} docker tag "${NAMESPACE}/${name}:${BUILT}" "${NAMESPACE}/${name}:${tag}"
        ${RUN} docker push "${NAMESPACE}/${name}:${tag}"
    done
done
