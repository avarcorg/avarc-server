#!/bin/sh
# Start, stop and reset the deployment. Without arguments, or with --help,
# it prints the usage below and exits.
#
#   deploy/run.sh [--stage] up     pull the images (from a registry), then start in
#                                  the foreground (systemd runs it so; add -d to
#                                  detach)
#   deploy/run.sh [--stage] down   stop, keep data
#   deploy/run.sh [--stage] stop|start|restart|ps|logs|top|kill|pause|unpause|exec|port|events
#                                  act on the running containers; they need
#                                  no write access and no secrets file
#   deploy/run.sh reset            dev only: stop, delete local data and secrets
#   deploy/run.sh [--stage] <other>  passed to "docker compose" (pull, config, ...)
#   deploy/run.sh --help           this help
#
# Environment: "--stage" (used by the systemd unit on the staging host)
# selects stage; without it the environment is dev. SECRETS=dev|stage|prod
# overrides the environment, which is how prod is selected.
#
# The database is served on the tailnet as avarc-<environment>-db when the
# secrets file sets DB_TAILNET=true (dev and stage only; create-db-user.sh
# makes the read-only account for it).
#
# Secrets: the values live in secrets.dev.sh (dev; generated on first run),
# secrets.stage.sh (stage) or secrets.sh (prod), all exporting one variable
# per secret (it may also set IMAGE_NAMESPACE and the *_VERSION variables
# when the environment does not). Containers get one read-only file per secret from a directory
# in memory (/run/avarc-<environment>), never an environment variable. The compose file is
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
P=$(dirname "$(realpath "$0")")
export P
cd "${P}"

case "${ENVIRONMENT}" in
    dev)   DEFAULT_PORT=8080; SECRETS_FILE=${P}/secrets.dev.sh ;;
    stage) DEFAULT_PORT=8081; SECRETS_FILE=${P}/secrets.stage.sh ;;
    prod)  DEFAULT_PORT=8082; SECRETS_FILE=${P}/secrets.sh ;;
esac
# Prints the value of secret $2 as exported by the secrets file $1, or
# nothing. The file is sourced by a shell with an empty environment, so only
# what it exports is found, never the launcher's own variables.
secret_value () {
    env -i sh -c '. "$0" > /dev/null 2>&1; printenv "$1" || true' "$1" "$2"
}

# Exports $1 from the environment, else from the secrets file, else as $2.
host_setting () {
    eval "_setting=\${$1:-}"
    if [ -z "${_setting}" ] && [ -r "${SECRETS_FILE}" ]
    then
        _setting=$(secret_value "${SECRETS_FILE}" "$1")
    fi
    export "$1=${_setting:-$2}"
}
# Keep the *_VERSION defaults equal to the version in pom.xml.
host_setting IMAGE_NAMESPACE avarcorg
host_setting BACKEND_VERSION 0.1.0-SNAPSHOT
host_setting FRONTEND_VERSION 0.1.0-SNAPSHOT
host_setting INGRESS_VERSION 0.1.0-SNAPSHOT
host_setting KEYCLOAK_VERSION 0.1.0-SNAPSHOT
export INGRESS_PORT=${INGRESS_PORT:-${DEFAULT_PORT}}
# Exposing the database on the tailnet is an opt-in of dev and stage
# (DB_TAILNET=true in the secrets file) and never happens on prod.
host_setting DB_TAILNET false
# Keycloak's database as a second connection of the database tool; the access
# itself is granted by create-db-user.sh.
host_setting DB_KEYCLOAK false
DB_DOCKTAIL_ENABLE=false
if [ "${DB_TAILNET}" = "true" ]
then
    if [ "${ENVIRONMENT}" = "prod" ]
    then
        echo "run.sh: DB_TAILNET is ignored on prod, the database is not exposed" >&2
    else
        DB_DOCKTAIL_ENABLE=true
    fi
fi
export DB_DOCKTAIL_ENABLE
# The web database tool goes with the exposed database: it is the Compose
# profile "dbtool", enabled under the same conditions.
DBTOOL_ENABLE=${DB_DOCKTAIL_ENABLE}
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
# The loopback port of Keycloak (used by the account scripts), and the address of its
# admin console, which docktail serves on the tailnet as ${NAME}-kc.
case "${ENVIRONMENT}" in
    dev) export KEYCLOAK_ADMIN_PORT=${KEYCLOAK_ADMIN_PORT:-8180} ;;
    stage) export KEYCLOAK_ADMIN_PORT=${KEYCLOAK_ADMIN_PORT:-8181} ;;
    prod) export KEYCLOAK_ADMIN_PORT=${KEYCLOAK_ADMIN_PORT:-8182} ;;
esac
export KEYCLOAK_ADMIN_ORIGIN=${KEYCLOAK_ADMIN_ORIGIN:-https://${NAME}-kc${TAILNET_DOMAIN:+.${TAILNET_DOMAIN}}}
export DBTOOL_ORIGIN=${DBTOOL_ORIGIN:-https://${NAME}-dbadmin${TAILNET_DOMAIN:+.${TAILNET_DOMAIN}}}
# Footer links of the frontend: none on prod; the database tool only if enabled.
FOOTER_API_DOCS=false
FOOTER_DBTOOL_URL=
FOOTER_KEYCLOAK_URL=
if [ "${ENVIRONMENT}" != "prod" ]
then
    FOOTER_API_DOCS=true
    FOOTER_KEYCLOAK_URL=${KEYCLOAK_ADMIN_ORIGIN}/auth/admin/avarc/console/
    [ "${DBTOOL_ENABLE}" = "true" ] && FOOTER_DBTOOL_URL=${DBTOOL_ORIGIN}
fi
export FOOTER_API_DOCS FOOTER_DBTOOL_URL FOOTER_KEYCLOAK_URL
RUN_UID=$(id -u)
export RUN_UID
# The run directory, in memory: the one the systemd unit creates for its user
# (RuntimeDirectory=), else, without a unit (dev), one in the user's runtime
# directory.
RUN_DIR=/run/${NAME}
[ -w "${RUN_DIR}" ] || RUN_DIR=${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/${NAME}
export SECRETS_RUN_DIR=${SECRETS_RUN_DIR:-${RUN_DIR}/secrets}
# The configuration of the web database tool, rendered at each start; a
# directory of its own, because the one above is mounted into several
# containers.
export DBTOOL_RUN_DIR=${DBTOOL_RUN_DIR:-${RUN_DIR}/dbtool}

# Commands on the running containers need no rendered file and no secrets:
# compose finds the containers by the project name, so a user who may use
# Docker but owns none of these files can run them. "down" also removes the
# in-memory directories where it can, and leaves them to their owner otherwise.
case "${COMMAND}" in
    down|stop|start|restart|ps|logs|top|kill|pause|unpause|exec|port|events)
        docker compose -p "${NAME}" "$@"
        [ "${COMMAND}" != "down" ] || rm -rf "${SECRETS_RUN_DIR}" "${DBTOOL_RUN_DIR}" 2> /dev/null || true
        exit 0 ;;
esac

# The secrets the deployment needs; one file each in ${SECRETS_RUN_DIR}.
NEEDED_SECRETS="POSTGRES_PASSWORD KEYCLOAK_ADMIN_PASSWORD KEYCLOAK_CLIENT_SECRET"

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
            # the initial account, created by create-admin-user.sh
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

# The profile of the database tool is part of every command while the tool is
# enabled; "down" always includes it, so that it stops the tool as well.
if [ "${DBTOOL_ENABLE}" = "true" ] || [ "${COMMAND}" = "down" ]
then
    export COMPOSE_PROFILES=dbtool
fi

COMPOSE="docker compose -f ${P}/docker-compose.yml"

render_compose () {
    envsubst < "${P}/docker-compose.template" > "${P}/docker-compose.yml"
    chmod 0600 "${P}/docker-compose.yml"
}

# Escapes a value for a JSON string.
json_escape () {
    printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

# Prints a random password that meets the database tool's policy (at least
# eight characters, mixed case, a digit).
random_password () {
    while :
    do
        _pw=$(head -c 256 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 24)
        case "${_pw}" in *[A-Z]*) ;; *) continue ;; esac
        case "${_pw}" in *[a-z]*) ;; *) continue ;; esac
        case "${_pw}" in *[0-9]*) ;; *) continue ;; esac
        printf '%s' "${_pw}"
        return 0
    done
}

# Prints the connection of the database tool to database $1 (also its id and
# name) with the read-only account; $2 is the escaped password.
datasource_json () {
    cat <<JSON
    "$1": {
      "provider": "postgresql",
      "driver": "postgres-jdbc",
      "name": "$1",
      "save-password": true,
      "read-only": true,
      "configuration": {
        "host": "db",
        "port": "5432",
        "database": "$1",
        "url": "jdbc:postgresql://db:5432/$1",
        "configurationType": "MANUAL",
        "auth-model": "native",
        "auth-properties": {
          "user": "avarc_ro",
          "password": "$2"
        }
      }
    }
JSON
}

# Renders the configuration of the database tool into ${DBTOOL_RUN_DIR}: the
# server configuration (admin account, so that the first-run wizard never
# appears) and the connections, which use the read-only account. The admin
# password is DBTOOL_ADMIN_PASSWORD of the secrets file; if the file has none,
# a generated one is appended to it. A missing DB_READONLY_PASSWORD (see
# create-db-user.sh) leaves the connection without a password: the tool still
# starts, the connection fails. Never prints a value.
build_dbtool_dir () {
    case "$-" in *x*) _xtrace=on ;; *) _xtrace=off ;; esac
    set +x
    ( umask 077; mkdir -p "${DBTOOL_RUN_DIR}" )
    chmod 700 "${DBTOOL_RUN_DIR}"
    find "${DBTOOL_RUN_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    _admin_name=$(secret_value "${SECRETS_FILE}" DBTOOL_ADMIN_NAME)
    _admin_name=${_admin_name:-dbadmin}
    # "admin" and "user" are the names of the tool's built-in teams; an
    # account of the same name cannot be created.
    case "${_admin_name}" in
        admin|user)
            echo "run.sh: DBTOOL_ADMIN_NAME must not be '${_admin_name}' (a built-in team of the tool)" >&2
            [ "${_xtrace}" = on ] && set -x
            return 1 ;;
    esac
    _admin_password=$(secret_value "${SECRETS_FILE}" DBTOOL_ADMIN_PASSWORD)
    if [ -z "${_admin_password}" ]
    then
        _admin_password=$(random_password)
        (
            umask 077
            [ ! -s "${SECRETS_FILE}" ] || [ -z "$(tail -c 1 "${SECRETS_FILE}")" ] || echo >> "${SECRETS_FILE}"
            echo "export DBTOOL_ADMIN_PASSWORD=${_admin_password}" >> "${SECRETS_FILE}"
        )
        echo "run.sh: generated a password and added DBTOOL_ADMIN_PASSWORD to ${SECRETS_FILE}" >&2
    fi
    _ro_password=$(secret_value "${SECRETS_FILE}" DB_READONLY_PASSWORD)
    # The tool creates the admin account only when its workspace is first
    # started. A fingerprint of name and password in the workspace shows when
    # the secrets file has changed since; the tool's own database is then
    # removed (its connections are rendered above, nothing else is in it), so
    # that the account is created again. No fingerprint (a workspace from
    # before this check) counts as changed.
    _workspace="${P}/data/${ENVIRONMENT}/dbtool"
    _fingerprint=$(printf '%s\n%s' "${_admin_name}" "${_admin_password}" | sha256sum | cut -d' ' -f1)
    if [ -d "${_workspace}/.data" ] && [ "$(cat "${_workspace}/.admin-fingerprint" 2>/dev/null || true)" != "${_fingerprint}" ]
    then
        echo "run.sh: the admin account of the database tool changed; its accounts are reset" >&2
        ${COMPOSE} --profile dbtool rm -sf dbtool > /dev/null 2>&1 || true
        rm -rf "${_workspace}/.data" "${_workspace}/.metadata"
    fi
    mkdir -p "${_workspace}"
    ( umask 077; printf '%s\n' "${_fingerprint}" > "${_workspace}/.admin-fingerprint" )
    # Java properties: a backslash must be doubled.
    _props_name=$(printf '%s' "${_admin_name}" | sed 's/\\/\\\\/g')
    _props_password=$(printf '%s' "${_admin_password}" | sed 's/\\/\\\\/g')
    _ro_json=$(json_escape "${_ro_password}")
    _connections=$(datasource_json avarc "${_ro_json}")
    if [ "${DB_KEYCLOAK}" = "true" ]
    then
        _connections="${_connections},
$(datasource_json keycloak "${_ro_json}")"
    fi
    (
        umask 077
        {
            echo "CB_SERVER_NAME=${NAME} database"
            echo "CB_SERVER_URL=${DBTOOL_ORIGIN}"
            echo "CB_ADMIN_NAME=${_props_name}"
            echo "CB_ADMIN_PASSWORD=${_props_password}"
        } > "${DBTOOL_RUN_DIR}/auto.conf"
        cat > "${DBTOOL_RUN_DIR}/data-sources.json" <<JSON
{
  "folders": {},
  "connections": {
${_connections}
  }
}
JSON
    )
    # The container user reads them; the 0700 directory holds others back.
    chmod 0444 "${DBTOOL_RUN_DIR}/auto.conf" "${DBTOOL_RUN_DIR}/data-sources.json"
    # The workspace on the host, with the mount point of the connections file
    # made by this user (the container would otherwise create it as root).
    mkdir -p "${P}/data/${ENVIRONMENT}/dbtool/GlobalConfiguration/.dbeaver"
    : >> "${P}/data/${ENVIRONMENT}/dbtool/GlobalConfiguration/.dbeaver/data-sources.json"
    _admin_password=; _props_password=; _ro_password=; _ro_json=; _fingerprint=
    [ "${_xtrace}" = on ] && set -x
    return 0
}

# Pulls the images of the project when IMAGE_NAMESPACE names a registry
# (it contains a "/"); otherwise they are built on the host and nothing is
# pulled. Tries again after a pause if the pull fails.
pull_images () {
    case "${IMAGE_NAMESPACE}" in
        */*) ;;
        *) return 0 ;;
    esac
    _attempt=1
    _attempts=${PULL_ATTEMPTS:-4}
    until ${COMPOSE} pull
    do
        if [ "${_attempt}" -ge "${_attempts}" ]
        then
            echo "run.sh: could not pull the images from ${IMAGE_NAMESPACE} (${_attempts} attempts)" >&2
            return 1
        fi
        echo "run.sh: image pull failed (attempt ${_attempt} of ${_attempts}), retrying in ${PULL_RETRY_DELAY:-15} seconds" >&2
        _attempt=$((_attempt + 1))
        sleep "${PULL_RETRY_DELAY:-15}"
    done
}

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

( umask 077; mkdir -p "${RUN_DIR}" ) 2> /dev/null || {
    echo "run.sh: cannot create ${RUN_DIR}; start the project through its systemd unit (RuntimeDirectory=)" >&2
    exit 1
}
create_dev_secrets
[ -f "${SECRETS_FILE}" ] && chmod 0600 "${SECRETS_FILE}"
build_secrets_dir
mkdir -p "${P}/data/${ENVIRONMENT}/db"
render_compose
if [ "${DBTOOL_ENABLE}" = "true" ]
then
    build_dbtool_dir
else
    rm -rf "${DBTOOL_RUN_DIR}"
    # A tool left running from a time when it was enabled is stopped and removed.
    [ "${COMMAND}" != "up" ] || ${COMPOSE} --profile dbtool rm -sf dbtool > /dev/null 2>&1 || true
fi

# One-shot services exit right after their job, and compose has no
# "remove on exit". The foreground "up" blocks until the project is torn
# down, so each one is watched from the background: wait for its container,
# wait for it to exit, then wait until the service that depends on it has
# been started after that exit (a container left over from an earlier run
# does not count; removing the one-shot container before compose has seen it
# complete makes "up" fail), and remove it. If that never happens, for
# example because the dependent kept running, the container stays. The
# watcher has no output of its own and holds no inherited descriptors: with
# "up -d" it outlives run.sh, and a caller that reads run.sh's output would
# otherwise wait for it.
remove_when_done () {
    service=$1
    dependent=$2
    (
        tries=0
        cid=""
        while [ -z "${cid}" ] && [ "${tries}" -lt 600 ]
        do
            sleep 1
            tries=$((tries + 1))
            cid=$(${COMPOSE} ps -a -q "${service}" 2>/dev/null || true)
        done
        [ -n "${cid}" ] || exit 0
        docker wait "${cid}" >/dev/null 2>&1 || true
        finished=$(docker inspect -f '{{.State.FinishedAt}}' "${cid}" 2>/dev/null || true)
        [ -n "${finished}" ] || exit 0
        while [ "${tries}" -lt 600 ]
        do
            dcid=$(${COMPOSE} ps -a -q "${dependent}" 2>/dev/null || true)
            started=
            [ -z "${dcid}" ] || started=$(docker inspect -f '{{.State.StartedAt}}' "${dcid}" 2>/dev/null || true)
            if [ -n "${started}" ] && [ "${started}" != "${finished}" ] \
                && [ "$(printf '%s\n%s\n' "${finished}" "${started}" | sort | tail -n 1)" = "${started}" ]
            then
                ${COMPOSE} rm -f "${service}" >/dev/null 2>&1 || true
                exit 0
            fi
            sleep 1
            tries=$((tries + 1))
        done
    ) < /dev/null > /dev/null 2>&1 &
}

case "${COMMAND}" in
    up) pull_images; remove_when_done keycloak-init keycloak; shift; ${COMPOSE} up --pull missing "$@" ;;
    *)  ${COMPOSE} "$@" ;;
esac
