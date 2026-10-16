#!/bin/sh
# Synchronises the locations with the schema legacy (see import-sql.sh): creates
# or updates a location per legacy place, tags and references included, and
# prints a report of the places it could not import. Safe to repeat: a rerun on
# unchanged legacy data writes nothing. One transaction.
#
#   deploy/import-legacy.sh [--stage] [--dry-run]
#                                           (SECRETS=dev|stage as for run.sh)
#
# --dry-run does everything and rolls back, so the report and the counts show
# what a real run would do. Run it on the host of the environment, like
# import-sql.sh: the database's own account runs the statements inside the db
# container, no password is read. Not available for prod. Rules and mapping:
# spec/SPEC-locations.md.
set -e

PROG=import-legacy.sh
ENVIRONMENT=dev
DRY=off
while [ $# -gt 0 ]
do
    case "$1" in
        --stage) ENVIRONMENT=stage ;;
        --dry-run) DRY=on ;;
        -h|--help) sed -n '2,/^set -e$/p' "$0" | sed -e '/^set -e$/d' -e 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "${PROG}: unknown argument '$1'" >&2; exit 1 ;;
    esac
    shift
done
ENVIRONMENT=${SECRETS:-${ENVIRONMENT}}
case "${ENVIRONMENT}" in
    dev|stage) ;;
    prod) echo "${PROG}: not available for prod" >&2; exit 1 ;;
    *) echo "${PROG}: SECRETS must be dev or stage, not '${ENVIRONMENT}'" >&2; exit 1 ;;
esac

HERE=$(cd "$(dirname "$0")" && pwd)
_compose () {
    docker compose -p "avarc-${ENVIRONMENT}" "$@"
}
if [ -z "$(_compose ps -q db)" ]
then
    echo "${PROG}: the db service of avarc-${ENVIRONMENT} is not running" >&2
    exit 1
fi

_compose exec -T db psql -X -q -v ON_ERROR_STOP=1 -v "dry=${DRY}" -U avarc -d avarc < "${HERE}/import-legacy.sql"
