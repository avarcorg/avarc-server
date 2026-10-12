#!/bin/sh
# Start, stop and reset the deployment. Without arguments, or with --help,
# it prints the usage below and exits.
#
#   deploy/run.sh [--stage] up     start in the foreground (systemd runs it so;
#                                  add -d to detach)
#   deploy/run.sh [--stage] down   stop, keep data
#   deploy/run.sh reset            dev only: stop, delete local data and secrets
#   deploy/run.sh [--stage] <other>  passed to "docker compose" (logs, ps, ...)
#   deploy/run.sh --help           this help
#
# Environment: "--stage" (used by the systemd unit on the staging host)
# selects stage; without it the environment is dev. SECRETS=dev|stage|prod
# overrides the environment, which is how prod is selected.
#
# Secrets: the values live in secrets.dev.sh (dev; generated on first run),
# secrets.stage.sh (stage) or secrets.sh (prod), all exporting one variable
# per secret. Containers get one read-only file per secret from a directory
# in memory (/dev/shm), never an environment variable. The compose file is
# rendered with envsubst from docker-compose.template. See
# spec/SPEC-deployment.md.
set -e

usage () {
    sed -n '2,/^set -e$/p' "$0" | sed -e '/^set -e$/d' -e 's/^# \{0,1\}//'
}

ENVIRONMENT=dev
# Drop "--stage" from the arguments; the rest is for docker compose.
for arg in "$@"
do
    shift
    case "${arg}" in
        --stage) ENVIRONMENT=stage ;;
        --help|-h) usage; exit 0 ;;
        *)       set -- "$@" "${arg}" ;;
    esac
done
if [ $# -eq 0 ]
then
    usage
    exit 0
fi
COMMAND=$1
ENVIRONMENT=${SECRETS:-${ENVIRONMENT}}
case "${ENVIRONMENT}" in
    dev|stage|prod) ;;
    *) echo "run.sh: SECRETS must be dev, stage or prod, not '${ENVIRONMENT}'" >&2; exit 1 ;;
esac

export ENVIRONMENT
export NAME=avarc-${ENVIRONMENT}
export P=$(dirname "$(realpath "$0")")
cd "${P}"

case "${ENVIRONMENT}" in
    dev)   DEFAULT_PORT=8080; SECRETS_FILE=${P}/secrets.dev.sh ;;
    stage) DEFAULT_PORT=8081; SECRETS_FILE=${P}/secrets.stage.sh ;;
    prod)  DEFAULT_PORT=8082; SECRETS_FILE=${P}/secrets.sh ;;
esac
# Keep BACKEND_VERSION's default equal to the version in pom.xml.
export IMAGE_NAMESPACE=${IMAGE_NAMESPACE:-avarcorg}
export BACKEND_VERSION=${BACKEND_VERSION:-0.1.0-SNAPSHOT}
export INGRESS_PORT=${INGRESS_PORT:-${DEFAULT_PORT}}
# The tailnet's domain, under which docktail serves the names with a
# certificate; empty if it cannot be determined.
TAILNET_DOMAIN=$(tailscale status --json 2>/dev/null | jq -r '.MagicDNSSuffix // empty' 2>/dev/null || true)
# Keycloak's admin console, served under another name, takes its realm
# addresses from this origin, so a browser on the tailnet must be able to
# reach it. Only without a tailnet does dev fall back to localhost.
if [ -n "${TAILNET_DOMAIN}" ]
then
    export PUBLIC_ORIGIN=${PUBLIC_ORIGIN:-https://${NAME}.${TAILNET_DOMAIN}}
elif [ "${ENVIRONMENT}" = "dev" ]
then
    export PUBLIC_ORIGIN=${PUBLIC_ORIGIN:-http://localhost:${INGRESS_PORT}}
else
    export PUBLIC_ORIGIN=${PUBLIC_ORIGIN:-https://${NAME}}
fi
# The loopback port of Keycloak (used by accounts.sh), and the address of its
# admin console, which docktail serves on the tailnet as ${NAME}-kc.
case "${ENVIRONMENT}" in
    dev) export KEYCLOAK_ADMIN_PORT=${KEYCLOAK_ADMIN_PORT:-8180} ;;
    stage) export KEYCLOAK_ADMIN_PORT=${KEYCLOAK_ADMIN_PORT:-8181} ;;
    prod) export KEYCLOAK_ADMIN_PORT=${KEYCLOAK_ADMIN_PORT:-8182} ;;
esac
export KEYCLOAK_ADMIN_ORIGIN=${KEYCLOAK_ADMIN_ORIGIN:-https://${NAME}-kc${TAILNET_DOMAIN:+.${TAILNET_DOMAIN}}}
export RUN_UID=$(id -u)
export SECRETS_RUN_DIR=${SECRETS_RUN_DIR:-/dev/shm/${NAME}-secrets}

# The secrets the deployment needs; one file each in ${SECRETS_RUN_DIR}.
NEEDED_SECRETS="POSTGRES_PASSWORD KEYCLOAK_ADMIN_PASSWORD KEYCLOAK_CLIENT_SECRET"

# Prints the value of secret $2 as exported by the secrets file $1, or
# nothing. The file is sourced by a shell with an empty environment, so only
# what it exports is found, never the launcher's own variables.
secret_value () {
    env -i sh -c '. "$0" > /dev/null 2>&1; printenv "$1" || true' "$1" "$2"
}

# Creates the dev secrets file with random values, once.
create_dev_secrets () {
    [ "${ENVIRONMENT}" = "dev" ] || return 0
    [ -e "${SECRETS_FILE}" ] && return 0
    case "$-" in *x*) _xtrace=on ;; *) _xtrace=off ;; esac
    set +x
    (
        umask 077
        {
            echo "#!/bin/sh"
            for _name in ${NEEDED_SECRETS}
            do
                echo "export ${_name}=$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 32)"
            done
            # the initial account, created by accounts.sh
            echo "export ADMIN_EMAIL=admin@avarc.invalid"
            echo "export ADMIN_PASSWORD=$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)"
        } > "${SECRETS_FILE}"
    )
    [ "${_xtrace}" = on ] && set -x
    return 0
}

# Fills ${SECRETS_RUN_DIR} with one file per needed secret (mode 0400, the
# directory 0700). Stops on a missing value, naming it. Never prints a value
# and keeps tracing off while it handles them.
build_secrets_dir () {
    case "$-" in *x*) _xtrace=on ;; *) _xtrace=off ;; esac
    set +x
    ( umask 077; mkdir -p "${SECRETS_RUN_DIR}" )
    chmod 700 "${SECRETS_RUN_DIR}"
    find "${SECRETS_RUN_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    _missing=
    for _name in ${NEEDED_SECRETS}
    do
        _value=
        [ -r "${SECRETS_FILE}" ] && _value=$(secret_value "${SECRETS_FILE}" "${_name}")
        if [ -z "${_value}" ]
        then
            _missing="${_missing} ${_name}"
        else
            # readable by the container user, not by others: the file is
            # world-readable inside the 0700 directory, which holds it back
            ( umask 077; printf '%s' "${_value}" > "${SECRETS_RUN_DIR}/${_name}" )
            chmod 0444 "${SECRETS_RUN_DIR}/${_name}"
        fi
    done
    _value=
    [ "${_xtrace}" = on ] && set -x
    if [ -n "${_missing}" ]
    then
        echo "run.sh: no value in ${SECRETS_FILE} for:${_missing}" >&2
        rm -rf "${SECRETS_RUN_DIR}"
        return 1
    fi
}

COMPOSE="docker compose -f ${P}/docker-compose.yml"

render_compose () {
    envsubst < "${P}/docker-compose.template" > "${P}/docker-compose.yml"
    chmod 0600 "${P}/docker-compose.yml"
}

if [ "${COMMAND}" = "down" ]
then
    render_compose
    ${COMPOSE} down
    rm -rf "${SECRETS_RUN_DIR}"
    exit 0
fi

if [ "${COMMAND}" = "reset" ]
then
    if [ "${ENVIRONMENT}" != "dev" ]
    then
        echo "run.sh: reset is only for dev" >&2
        exit 1
    fi
    render_compose
    ${COMPOSE} down --remove-orphans || true
    # Data written by containers may belong to other users.
    docker run --rm -v "${P}:/deploy" alpine rm -rf /deploy/data/dev
    rm -rf "${SECRETS_RUN_DIR}" "${P}/secrets.dev.sh" "${P}/docker-compose.yml"
    exit 0
fi

create_dev_secrets
[ -f "${SECRETS_FILE}" ] && chmod 0600 "${SECRETS_FILE}"
build_secrets_dir
mkdir -p "${P}/data/${ENVIRONMENT}/db"
render_compose

case "${COMMAND}" in
    up) shift; ${COMPOSE} up --pull missing "$@" ;;
    *)  ${COMPOSE} "$@" ;;
esac
