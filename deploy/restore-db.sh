#!/bin/sh
# Restores the databases of dev, stage or prod from one backup run of
# deploy/backup-db.sh, or tries a backup in a throwaway container. See
# spec/SPEC-deployment.md.
#
#   deploy/restore-db.sh [--stage] [--scratch] [--database NAME]... [--globals] [--no-backup] [--yes] [STAMP]
#
#   STAMP        the run to restore, like 20261018-030010; default: the newest
#   --scratch    restore into a throwaway container of the image of the db
#                service (no volume, no published port, removed at the end) and
#                compare with the running database; the environment is not
#                touched and nothing needs to be stopped. Set RESTORE_IMAGE
#                when the project is not running.
#   --database   restore only this database (avarc or keycloak); may be repeated;
#                default: every database that has a dump in the run
#   --globals    also restore the roles; only for a new cluster (errors for
#                roles that exist are harmless); --scratch does it by default
#   --no-backup  do not take a backup of the current data first
#   --yes        do not ask for confirmation
#
# (SECRETS=dev|stage|prod as for run.sh.) Without --scratch the data of the
# environment is replaced: each database of the run is dropped and recreated
# from its dump. Stop the backend, keycloak and dbtool services first (the
# script refuses otherwise) and start them again afterwards. The backups come
# from data/<environment>/backups next to this script, or from BACKUP_DIR. The
# statements run inside the db container as the database's own account over
# the local socket, so no password is read. It ends with a check of the
# migration history and the row counts.
set -e

PROG=restore-db.sh
ENVIRONMENT=dev
SCRATCH_MODE=0
GLOBALS=0
TAKE_BACKUP=1
ASSUME_YES=0
STAMP=
SELECTED=
while [ $# -gt 0 ]
do
    arg=$1
    shift
    case "${arg}" in
        --stage) ENVIRONMENT=stage ;;
        --scratch) SCRATCH_MODE=1 ;;
        --globals) GLOBALS=1 ;;
        --no-backup) TAKE_BACKUP=0 ;;
        --yes) ASSUME_YES=1 ;;
        --database)
            [ $# -gt 0 ] || { echo "${PROG}: --database needs a name" >&2; exit 1; }
            case "$1" in
                avarc|keycloak) SELECTED="${SELECTED} $1" ;;
                *) echo "${PROG}: --database must be avarc or keycloak, not '$1'" >&2; exit 1 ;;
            esac
            shift ;;
        -h|--help) sed -n '2,/^set -e$/p' "$0" | sed -e '/^set -e$/d' -e 's/^# \{0,1\}//'; exit 0 ;;
        -*) echo "${PROG}: unknown argument '${arg}'" >&2; exit 1 ;;
        *) STAMP=${arg} ;;
    esac
done
ENVIRONMENT=${SECRETS:-${ENVIRONMENT}}
case "${ENVIRONMENT}" in
    dev|stage|prod) ;;
    *) echo "${PROG}: SECRETS must be dev, stage or prod, not '${ENVIRONMENT}'" >&2; exit 1 ;;
esac

P=$(dirname "$(realpath "$0")")
BACKUP_DIR=${BACKUP_DIR:-${P}/data/${ENVIRONMENT}/backups}
_compose () {
    docker compose -p "avarc-${ENVIRONMENT}" "$@"
}
LIVE_UP=0
if [ -n "$(_compose ps -q db 2> /dev/null)" ]
then
    LIVE_UP=1
fi

# The run to restore: the given stamp, or the newest one.
[ -d "${BACKUP_DIR}" ] || { echo "${PROG}: no backups directory ${BACKUP_DIR}" >&2; exit 1; }
if [ -z "${STAMP}" ]
then
    STAMP=$(ls "${BACKUP_DIR}" | sed -n 's/^avarc-\([0-9]\{8\}-[0-9]\{6\}\)\.dump$/\1/p' | sort | tail -n 1)
fi
case "${STAMP}" in
    [0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9][0-9][0-9]) ;;
    '') echo "${PROG}: no backup found in ${BACKUP_DIR}" >&2; exit 1 ;;
    *) echo "${PROG}: the stamp must look like 20261018-030010, not '${STAMP}'" >&2; exit 1 ;;
esac
[ -e "${BACKUP_DIR}/avarc-${STAMP}.dump" ] || [ -e "${BACKUP_DIR}/keycloak-${STAMP}.dump" ] || { echo "${PROG}: no dump of ${STAMP} in ${BACKUP_DIR}" >&2; exit 1; }
# The databases: the selected ones, or every one that has a dump in the run.
if [ -z "${SELECTED}" ]
then
    SELECTED=avarc
    [ -e "${BACKUP_DIR}/keycloak-${STAMP}.dump" ] && SELECTED="${SELECTED} keycloak"
fi
DATABASES=
for database in avarc keycloak
do
    case " ${SELECTED} " in
        *" ${database} "*)
            [ -r "${BACKUP_DIR}/${database}-${STAMP}.dump" ] || { echo "${PROG}: cannot read ${BACKUP_DIR}/${database}-${STAMP}.dump" >&2; exit 1; }
            DATABASES="${DATABASES:+${DATABASES} }${database}"
            ;;
    esac
done
# A scratch cluster is new, so it gets the roles of the run when there are any.
if [ "${SCRATCH_MODE}" = 1 ] && [ -r "${BACKUP_DIR}/globals-${STAMP}.sql" ]
then
    GLOBALS=1
fi
if [ "${GLOBALS}" = 1 ]
then
    [ -r "${BACKUP_DIR}/globals-${STAMP}.sql" ] || { echo "${PROG}: cannot read ${BACKUP_DIR}/globals-${STAMP}.sql" >&2; exit 1; }
fi

SCRATCH_NAME=
cleanup () {
    if [ -n "${SCRATCH_NAME}" ]
    then
        docker rm -f "${SCRATCH_NAME}" > /dev/null 2>&1 || true
    fi
}
trap cleanup EXIT

if [ "${SCRATCH_MODE}" = 1 ]
then
    IMAGE=${RESTORE_IMAGE:-}
    if [ -z "${IMAGE}" ] && [ "${LIVE_UP}" = 1 ]
    then
        IMAGE=$(docker inspect -f '{{.Config.Image}}' "$(_compose ps -q db)")
    fi
    [ -n "${IMAGE}" ] || { echo "${PROG}: the db service of avarc-${ENVIRONMENT} is not running; set RESTORE_IMAGE" >&2; exit 1; }
    SCRATCH_NAME=avarc-restore-scratch-$$
    docker run -d --name "${SCRATCH_NAME}" \
        -e POSTGRES_USER=avarc -e POSTGRES_PASSWORD=scratch -e POSTGRES_DB=avarc \
        "${IMAGE}" > /dev/null
    until docker exec "${SCRATCH_NAME}" pg_isready -h 127.0.0.1 -U avarc -d avarc -q
    do
        sleep 1
    done
    sleep 2
    # Runs a command inside the container that is restored into.
    target () { docker exec -i "${SCRATCH_NAME}" "$@"; }
else
    [ "${LIVE_UP}" = 1 ] || { echo "${PROG}: the db service of avarc-${ENVIRONMENT} is not running" >&2; exit 1; }
    if [ -n "$(_compose ps -q backend keycloak dbtool 2> /dev/null)" ]
    then
        echo "${PROG}: stop backend, keycloak and dbtool first (deploy/run.sh stop ...)" >&2
        exit 1
    fi
    if [ "${ASSUME_YES}" = 0 ]
    then
        printf 'This replaces the databases (%s) of %s with the backup %s.\nType %s to continue: ' \
            "${DATABASES}" "${ENVIRONMENT}" "${STAMP}" "${ENVIRONMENT}" >&2
        read -r answer || answer=
        [ "${answer}" = "${ENVIRONMENT}" ] || { echo "${PROG}: not confirmed" >&2; exit 1; }
    fi
    if [ "${TAKE_BACKUP}" = 1 ]
    then
        SECRETS=${ENVIRONMENT} "${P}/backup-db.sh"
    fi
    target () { _compose exec -T db "$@"; }
fi

echo "${PROG}: restoring ${DATABASES} from ${STAMP}$([ "${GLOBALS}" = 1 ] && echo ' and the roles')" >&2
if [ "${GLOBALS}" = 1 ]
then
    target psql -U avarc -d postgres -q < "${BACKUP_DIR}/globals-${STAMP}.sql" 2>&1 | grep -v 'already exists' || true
fi
for database in ${DATABASES}
do
    target pg_restore -U avarc -d postgres --clean --if-exists --create < "${BACKUP_DIR}/${database}-${STAMP}.dump"
    echo "${PROG}: restored ${database}" >&2
done

# The value of a query in the restored database and, for a scratch restore
# next to a running project, in the running one.
live () { _compose exec -T db psql -U avarc -tA -d "$1" -c "$2" 2> /dev/null || echo n/a; }
restored () { target psql -U avarc -tA -d "$1" -c "$2" 2> /dev/null || echo n/a; }
check () {
    _label=$1
    _db=$2
    _query=$3
    _value=$(restored "${_db}" "${_query}")
    if [ "${SCRATCH_MODE}" = 1 ] && [ "${LIVE_UP}" = 1 ]
    then
        _live=$(live "${_db}" "${_query}")
        if [ "${_live}" = "${_value}" ]
        then
            printf '%-32s %s (same as running)\n' "${_label}" "${_value}"
        else
            printf '%-32s %s (running: %s)\n' "${_label}" "${_value}" "${_live}"
        fi
    else
        printf '%-32s %s\n' "${_label}" "${_value}"
    fi
}
case " ${DATABASES} " in
    *" avarc "*)
        check "latest migration" avarc "SELECT max(version::int) FROM avarc.flyway_schema_history"
        check "migrations" avarc "SELECT count(*) FROM avarc.flyway_schema_history"
        check "locations" avarc "SELECT count(*) FROM avarc.location"
        check "locations with a position" avarc "SELECT count(position) FROM avarc.location"
        check "users" avarc "SELECT count(*) FROM avarc.app_user"
        ;;
esac
case " ${DATABASES} " in
    *" keycloak "*)
        check "keycloak accounts" keycloak "SELECT count(*) FROM user_entity"
        check "keycloak realms" keycloak "SELECT count(*) FROM realm"
        ;;
esac
if [ "${SCRATCH_MODE}" = 1 ]
then
    echo "${PROG}: done; the scratch container is removed" >&2
else
    echo "${PROG}: done; start the services again (deploy/run.sh up)" >&2
fi
