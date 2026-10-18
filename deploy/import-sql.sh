#!/bin/sh
# Loads a SQL file, such as the export of a legacy system, into the avarc
# database of dev or stage, into a schema of its own (default: legacy), so
# that it does not mix with the tables of the application.
#
#   deploy/import-sql.sh [--dev|--stage] [--schema NAME] FILE.sql
#                                           (environment: see environment-lib.sh)
#
# The file is plain SQL for PostgreSQL. Statements without a schema create
# their objects in the chosen schema, which is created if it is missing;
# names with a schema, such as public.table as pg_dump writes them, go where
# they say. The import runs in one transaction: an error stops it and leaves
# nothing behind. Run it on the host of the environment, like
# create-db-user.sh: the statements are run by the database's own account
# inside the db container, so no password is needed and none is read. The
# read-only account of create-db-user.sh reads only the schemas public and
# avarc, and the schema legacy when asked (create-db-user.sh --legacy).
# Not available for prod. See spec/SPEC-deployment.md.
set -e

PROG=import-sql.sh
. "$(dirname "$(realpath "$0")")/environment-lib.sh"
ENVIRONMENT=
SCHEMA=legacy
FILE=
while [ $# -gt 0 ]
do
    case "$1" in
        --dev) ENVIRONMENT=dev ;;
        --stage) ENVIRONMENT=stage ;;
        --prod) ENVIRONMENT=prod ;;
        --schema) shift; SCHEMA=${1:-} ;;
        -h|--help) sed -n '2,/^set -e$/p' "$0" | sed -e '/^set -e$/d' -e 's/^# \{0,1\}//'; exit 0 ;;
        -*) echo "${PROG}: unknown argument '$1'" >&2; exit 1 ;;
        *) [ -z "${FILE}" ] || { echo "${PROG}: more than one file given" >&2; exit 1; }; FILE=$1 ;;
    esac
    shift
done
ENVIRONMENT=${ENVIRONMENT:-${SECRETS:-$(default_environment)}}
case "${ENVIRONMENT}" in
    dev|stage) ;;
    prod) echo "${PROG}: not available for prod" >&2; exit 1 ;;
    *) echo "${PROG}: the environment must be dev or stage, not '${ENVIRONMENT}'" >&2; exit 1 ;;
esac
if [ -z "${FILE}" ] || [ ! -r "${FILE}" ]
then
    echo "usage: ${PROG} [--dev|--stage] [--schema NAME] FILE.sql (a readable file)" >&2
    exit 1
fi
# The name ends up in SQL, so only plain names are accepted, and not the
# schemas of the application or of PostgreSQL.
case "${SCHEMA}" in
    ''|*[!a-z0-9_]*|[0-9]*|public|avarc|pg_*|information_schema)
        echo "${PROG}: the schema must be a lower-case name other than public and avarc" >&2
        exit 1 ;;
esac

_compose () {
    docker compose -p "avarc-${ENVIRONMENT}" "$@"
}
if [ -z "$(_compose ps -q db)" ]
then
    echo "${PROG}: the db service of avarc-${ENVIRONMENT} is not running" >&2
    exit 1
fi

# One transaction: the schema, the search path for this import, then the file.
{
    echo "BEGIN;"
    echo "CREATE SCHEMA IF NOT EXISTS ${SCHEMA};"
    echo "SET LOCAL search_path TO ${SCHEMA};"
    cat "${FILE}"
    echo
    echo "COMMIT;"
} | _compose exec -T db psql -v ON_ERROR_STOP=1 -q -U avarc -d avarc > /dev/null
echo "${PROG}: ${FILE} is loaded into the schema ${SCHEMA} of avarc-${ENVIRONMENT}" >&2
