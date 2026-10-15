#!/bin/sh
# Creates, or updates, the read-only database account for inspecting the data
# of dev or stage with a SQL client (see DB_TAILNET in run.sh). Safe to run
# repeatedly.
#
#   deploy/create-db-user.sh [--stage] [--keycloak]
#                                           (SECRETS=dev|stage as for run.sh)
#
# The account is called avarc_ro; it may read the tables of the avarc database,
# in the schemas public and avarc (including tables created later) and nothing else, and its sessions are
# read-only. With --keycloak, or DB_KEYCLOAK=true in the secrets file, it may
# also read Keycloak's database, which holds users and credential hashes;
# without either, the account cannot even connect to that database (the
# connect right of everyone is revoked), and an earlier grant is undone. Its password is DB_READONLY_PASSWORD in the environment's
# secrets file; if the file has none, a random one is generated and appended
# to it. The password is never printed. Not available for prod. Needs a
# running project; the password reaches the database on the standard input of
# psql, never on a command line. See spec/SPEC-deployment.md.
set -e

PROG=create-db-user.sh
ENVIRONMENT=dev
KEYCLOAK=0
for arg in "$@"
do
    case "${arg}" in
        --stage) ENVIRONMENT=stage ;;
        --keycloak) KEYCLOAK=1 ;;
        -h|--help) sed -n '2,/^set -e$/p' "$0" | sed -e '/^set -e$/d' -e 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "${PROG}: unknown argument '${arg}'" >&2; exit 1 ;;
    esac
done
ENVIRONMENT=${SECRETS:-${ENVIRONMENT}}
case "${ENVIRONMENT}" in
    dev)   SECRETS_FILE=secrets.dev.sh ;;
    stage) SECRETS_FILE=secrets.stage.sh ;;
    prod)  echo "${PROG}: the database is not exposed on prod" >&2; exit 1 ;;
    *) echo "${PROG}: SECRETS must be dev or stage, not '${ENVIRONMENT}'" >&2; exit 1 ;;
esac
P=$(dirname "$(realpath "$0")")
SECRETS_FILE=${P}/${SECRETS_FILE}
ROLE=avarc_ro

# DB_KEYCLOAK=true in the environment or the secrets file means --keycloak.
if [ "${KEYCLOAK}" -eq 0 ]
then
    _keycloak=${DB_KEYCLOAK:-}
    if [ -z "${_keycloak}" ] && [ -r "${SECRETS_FILE}" ]
    then
        _keycloak=$(env -i sh -c '. "$0" > /dev/null 2>&1; printenv DB_KEYCLOAK || true' "${SECRETS_FILE}")
    fi
    [ "${_keycloak}" != "true" ] || KEYCLOAK=1
fi

_container=$(docker compose -p "avarc-${ENVIRONMENT}" ps -q db)
if [ -z "${_container}" ]
then
    echo "${PROG}: the db service of avarc-${ENVIRONMENT} is not running" >&2
    exit 1
fi

case "$-" in
    *x*) XTRACE_WAS_ON=1 ;;
    *)   XTRACE_WAS_ON=0 ;;
esac
set +x
# The password already in the secrets file, read in a shell of its own.
DB_READONLY_PASSWORD=
if [ -r "${SECRETS_FILE}" ]
then
    DB_READONLY_PASSWORD=$(env -i sh -c '. "$0" > /dev/null 2>&1; printenv DB_READONLY_PASSWORD || true' "${SECRETS_FILE}")
fi
if [ -z "${DB_READONLY_PASSWORD}" ]
then
    DB_READONLY_PASSWORD=$(head -c 256 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 24)
    (
        umask 077
        # start on a new line if the file does not end in one
        [ ! -s "${SECRETS_FILE}" ] || [ -z "$(tail -c 1 "${SECRETS_FILE}")" ] || echo >> "${SECRETS_FILE}"
        echo "export DB_READONLY_PASSWORD=${DB_READONLY_PASSWORD}" >> "${SECRETS_FILE}"
    )
    echo "${PROG}: generated a password and added DB_READONLY_PASSWORD to ${SECRETS_FILE}" >&2
fi

# The superuser avarc runs the statements inside the container (trust on the
# local socket). The role is created once; the password is set every time, so
# the secrets file stays the truth.
docker compose -p "avarc-${ENVIRONMENT}" exec -T db psql -v ON_ERROR_STOP=1 -q -U avarc -d avarc > /dev/null <<SQL
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${ROLE}') THEN
        CREATE ROLE ${ROLE} LOGIN;
    END IF;
END
\$\$;
ALTER ROLE ${ROLE} PASSWORD '${DB_READONLY_PASSWORD}';
ALTER ROLE ${ROLE} SET default_transaction_read_only = on;
GRANT CONNECT ON DATABASE avarc TO ${ROLE};
GRANT USAGE ON SCHEMA public TO ${ROLE};
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${ROLE};
ALTER DEFAULT PRIVILEGES FOR ROLE avarc IN SCHEMA public GRANT SELECT ON TABLES TO ${ROLE};
CREATE SCHEMA IF NOT EXISTS avarc;
GRANT USAGE ON SCHEMA avarc TO ${ROLE};
GRANT SELECT ON ALL TABLES IN SCHEMA avarc TO ${ROLE};
ALTER DEFAULT PRIVILEGES FOR ROLE avarc IN SCHEMA avarc GRANT SELECT ON TABLES TO ${ROLE};
SQL
DB_READONLY_PASSWORD=
[ "${XTRACE_WAS_ON}" -eq 1 ] && set -x

# Keycloak's database, if it exists: granted or withdrawn as asked.
psql_db () {
    docker compose -p "avarc-${ENVIRONMENT}" exec -T db psql -v ON_ERROR_STOP=1 -q -U avarc -d "$1" > /dev/null
}
if [ "$(docker compose -p "avarc-${ENVIRONMENT}" exec -T db psql -U avarc -d avarc -tAc "SELECT 1 FROM pg_database WHERE datname = 'keycloak'")" = "1" ]
then
    if [ "${KEYCLOAK}" -eq 1 ]
    then
        psql_db avarc <<SQL
REVOKE CONNECT ON DATABASE keycloak FROM PUBLIC;
GRANT CONNECT ON DATABASE keycloak TO ${ROLE};
SQL
        psql_db keycloak <<SQL
GRANT USAGE ON SCHEMA public TO ${ROLE};
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${ROLE};
ALTER DEFAULT PRIVILEGES FOR ROLE avarc IN SCHEMA public GRANT SELECT ON TABLES TO ${ROLE};
SQL
    else
        psql_db keycloak <<SQL
ALTER DEFAULT PRIVILEGES FOR ROLE avarc IN SCHEMA public REVOKE SELECT ON TABLES FROM ${ROLE};
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM ${ROLE};
REVOKE USAGE ON SCHEMA public FROM ${ROLE};
SQL
        psql_db avarc <<SQL
REVOKE CONNECT ON DATABASE keycloak FROM PUBLIC;
REVOKE CONNECT ON DATABASE keycloak FROM ${ROLE};
SQL
    fi
fi
echo "${PROG}: account ${ROLE} is ready on avarc-${ENVIRONMENT}; its password is DB_READONLY_PASSWORD in ${SECRETS_FILE}" >&2
