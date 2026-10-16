#!/bin/sh
# Tags the images built by `./mvnw -Pwith-docker package` for the registry
# and pushes them. See spec/SPEC-releases.md.
#
#   tools/publish-images.sh [--dry-run] [--module <name>]... <namespace> <git-ref> <commit>
#
# --module names an image to publish (backend, frontend, ingress or keycloak,
# repeatable); without it all four are published. A module build publishes
# only the image it built.
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
MODULES=
POSITIONAL=
while [ $# -gt 0 ]
do
    case "$1" in
        --dry-run) RUN="echo" ;;
        --module)
            shift
            case "${1:-}" in
                backend|frontend|ingress|keycloak) MODULES="${MODULES} ${1}" ;;
                *) echo "publish-images.sh: --module needs backend, frontend, ingress or keycloak" >&2; exit 1 ;;
            esac ;;
        --help|-h) usage; exit 0 ;;
        -*) echo "publish-images.sh: unknown option $1" >&2; exit 1 ;;
        *) POSITIONAL="${POSITIONAL} $1" ;;
    esac
    shift
done
# shellcheck disable=SC2086
set -- ${POSITIONAL}
if [ $# -ne 3 ]
then
    usage
    exit 1
fi
[ -n "${MODULES}" ] || MODULES=" backend frontend ingress keycloak"
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

for module in ${MODULES}
do
    name=avarc-${module}
    for tag in ${TAGS}
    do
        ${RUN} docker tag "${NAMESPACE}/${name}:${BUILT}" "${NAMESPACE}/${name}:${tag}"
        ${RUN} docker push "${NAMESPACE}/${name}:${tag}"
    done
done
