#!/bin/sh
# Takes a logical backup of the databases of dev, stage or prod: one dump of
# each database (avarc, and keycloak when it exists) in the custom format of
# pg_dump, and the roles as SQL, into the backups directory, and the users of
# Keycloak as JSON (export-keycloak-users.sh). Backups older than the retention window
# are removed. See spec/SPEC-deployment.md, which also
# describes the restore.
#
#   deploy/backup-db.sh [--dev|--stage|--prod]           (environment: see environment-lib.sh)
#
# The backups directory is data/<environment>/backups next to this script
# (gitignored); files are named <database>-<yyyymmdd-hhmmss>.dump and
# globals-<yyyymmdd-hhmmss>.sql, mode 0600, because they hold personal data
# and credential hashes. BACKUP_KEEP_DAYS (default 7) sets the window. The
# statements run inside the db container as the database's own account over
# the local socket, so the dump always matches the running PostgreSQL version
# and no password is read. A dump is written under a temporary name and
# renamed when it is complete, so a failed run leaves no partial backup under
# the final name. Needs a running project; the script fails with a message
# when the db service is not up.
set -e

PROG=backup-db.sh
. "$(dirname "$(realpath "$0")")/environment-lib.sh"
ENVIRONMENT=
for arg in "$@"
do
    case "${arg}" in
        --dev) ENVIRONMENT=dev ;;
        --stage) ENVIRONMENT=stage ;;
        --prod) ENVIRONMENT=prod ;;
        -h|--help) sed -n '2,/^set -e$/p' "$0" | sed -e '/^set -e$/d' -e 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "${PROG}: unknown argument '${arg}'" >&2; exit 1 ;;
    esac
done
ENVIRONMENT=${ENVIRONMENT:-${SECRETS:-$(default_environment)}}
case "${ENVIRONMENT}" in
    dev|stage|prod) ;;
    *) echo "${PROG}: the environment must be dev, stage or prod, not '${ENVIRONMENT}'" >&2; exit 1 ;;
esac
KEEP_DAYS=${BACKUP_KEEP_DAYS:-7}
case "${KEEP_DAYS}" in
    ''|*[!0-9]*) echo "${PROG}: BACKUP_KEEP_DAYS must be a number of days" >&2; exit 1 ;;
esac

P=$(dirname "$(realpath "$0")")
BACKUP_DIR=${P}/data/${ENVIRONMENT}/backups
_compose () {
    docker compose -p "avarc-${ENVIRONMENT}" "$@"
}
if [ -z "$(_compose ps -q db)" ]
then
    echo "${PROG}: the db service of avarc-${ENVIRONMENT} is not running" >&2
    exit 1
fi

umask 077
mkdir -p "${BACKUP_DIR}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Writes the output of the command to the file under a temporary name, then
# renames it; the temporary file is removed when the command fails.
save () {
    _target=$1
    shift
    if "$@" > "${_target}.part"
    then
        mv "${_target}.part" "${_target}"
    else
        rm -f "${_target}.part"
        echo "${PROG}: could not write ${_target}" >&2
        return 1
    fi
}

DATABASES=avarc
if [ "$(_compose exec -T db psql -U avarc -d avarc -tAc "SELECT 1 FROM pg_database WHERE datname = 'keycloak'")" = "1" ]
then
    DATABASES="${DATABASES} keycloak"
fi
for database in ${DATABASES}
do
    save "${BACKUP_DIR}/${database}-${TIMESTAMP}.dump" _compose exec -T db pg_dump -U avarc -Fc "${database}"
done
save "${BACKUP_DIR}/globals-${TIMESTAMP}.sql" _compose exec -T db pg_dumpall -U avarc --globals-only

# The users of Keycloak, a second protection next to the dump of its database.
# A failure is reported after the rest is done.
USERS_FAILED=0
if [ -n "$(_compose ps -q keycloak)" ]
then
    SECRETS=${ENVIRONMENT} BACKUP_DIR=${BACKUP_DIR} "${P}/export-keycloak-users.sh" || USERS_FAILED=1
else
    echo "${PROG}: keycloak is not running, its users are not exported" >&2
fi

find "${BACKUP_DIR}" -maxdepth 1 -type f \( -name '*.dump' -o -name 'globals-*.sql' -o -name 'keycloak-users-*.json' -o -name '*.part' \) -mtime "+${KEEP_DAYS}" -delete
echo "${PROG}: backed up ${DATABASES} of avarc-${ENVIRONMENT} into ${BACKUP_DIR}" >&2
[ "${USERS_FAILED}" -eq 0 ] || { echo "${PROG}: the export of the users failed" >&2; exit 1; }
