#!/bin/sh
# Creates the initial accounts in the running Keycloak of an environment. Safe
# to run repeatedly: accounts that already exist are left alone.
#
#   deploy/accounts.sh [--stage]     (SECRETS=dev|stage|prod as for run.sh)
#
# The credentials come from the environment's secrets file (see run.sh):
# ADMIN_EMAIL and ADMIN_PASSWORD, and optionally EDITOR_EMAIL /
# EDITOR_PASSWORD and VIEWER_EMAIL / VIEWER_PASSWORD, plus the
# KEYCLOAK_ADMIN_PASSWORD that run.sh also needs. Accounts are created in
# the avarc realm; the email is the user name, and the role is a realm role.
# Needs curl, jq and a running project. It talks to Keycloak's port on the
# loopback interface; the passwords reach Keycloak in request bodies
# and never on a command line. See spec/SPEC-auth.md.
set -e

ENVIRONMENT=dev
for arg in "$@"
do
    case "${arg}" in
        --stage) ENVIRONMENT=stage ;;
        -h|--help) sed -n '2,/^set -e$/p' "$0" | sed -e '/^set -e$/d' -e 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "accounts.sh: unknown argument '${arg}'" >&2; exit 1 ;;
    esac
done
ENVIRONMENT=${SECRETS:-${ENVIRONMENT}}
case "${ENVIRONMENT}" in
    dev)   SECRETS_FILE=secrets.dev.sh ;;
    stage) SECRETS_FILE=secrets.stage.sh ;;
    prod)  SECRETS_FILE=secrets.sh ;;
    *) echo "accounts.sh: SECRETS must be dev, stage or prod, not '${ENVIRONMENT}'" >&2; exit 1 ;;
esac
P=$(dirname "$(realpath "$0")")
SECRETS_FILE=${P}/${SECRETS_FILE}
CONTAINER=$(docker compose -p "avarc-${ENVIRONMENT}" ps -q keycloak)
if [ -z "${CONTAINER}" ]
then
    echo "accounts.sh: the keycloak service of avarc-${ENVIRONMENT} is not running" >&2
    exit 1
fi

case "$-" in
    *x*) XTRACE_WAS_ON=1 ;;
    *)   XTRACE_WAS_ON=0 ;;
esac
set +x
. "${SECRETS_FILE}"
[ "${XTRACE_WAS_ON}" -eq 1 ] && set -x

REALM=avarc

# Keycloak's port, published on the loopback interface only.
ADMIN_PORT=$(docker compose -p "avarc-${ENVIRONMENT}" port keycloak 8080 | sed 's/.*://')
BASE=http://127.0.0.1:${ADMIN_PORT}/auth

if [ -z "${ADMIN_EMAIL}" ] || [ -z "${ADMIN_PASSWORD}" ] || [ -z "${KEYCLOAK_ADMIN_PASSWORD}" ]
then
    echo "accounts.sh: ADMIN_EMAIL, ADMIN_PASSWORD and KEYCLOAK_ADMIN_PASSWORD are required in ${SECRETS_FILE}" >&2
    exit 1
fi

# The request headers sit in a file only the owner can read, not on a
# command line.
WORK=$(umask 077; mktemp -d)
trap 'rm -rf "${WORK}"' EXIT

# Waits until the master realm answers; right after a start it may not yet.
_tries=0
until curl -s -o /dev/null --fail "${BASE}/realms/master"
do
    _tries=$((_tries + 1))
    if [ "${_tries}" -ge 30 ]
    then
        echo "accounts.sh: Keycloak does not answer on ${BASE}" >&2
        exit 1
    fi
    sleep 2
done

# Writes an Authorization header for the master realm admin to ${WORK}/auth.
# The secrets file exports the password, so it is read from the environment.
login () {
    _token=$(jq -rn '"grant_type=password&client_id=admin-cli&username=keycloak-admin&password=" + (env.KEYCLOAK_ADMIN_PASSWORD | @uri)' \
        | curl -sS --fail-with-body --data @- "${BASE}/realms/master/protocol/openid-connect/token" \
        | jq -r .access_token)
    if [ -z "${_token}" ] || [ "${_token}" = null ]
    then
        echo "accounts.sh: login to Keycloak as keycloak-admin failed" >&2
        exit 1
    fi
    ( umask 077; printf 'header = "Authorization: Bearer %s"\n' "${_token}" > "${WORK}/auth" )
}

# api_get PATH: GET below the avarc realm's admin API.
api_get () {
    curl -sS --fail-with-body -K "${WORK}/auth" "${BASE}/admin/realms/${REALM}$1"
}

# api_post PATH: POST the JSON on the standard input.
api_post () {
    curl -sS --fail-with-body -K "${WORK}/auth" -H 'Content-Type: application/json' \
        --data-binary @- "${BASE}/admin/realms/${REALM}$1"
}

# create_account ROLE EMAIL PASSWORD
create_account () {
    _role=$1
    _email=$(printf '%s' "$2" | tr '[:upper:]' '[:lower:]')
    _password=$3
    login
    _query=$(printf '%s' "${_email}" | jq -sRr @uri)
    _id=$(api_get "/users?exact=true&username=${_query}" | jq -r '.[0].id // empty')
    if [ -n "${_id}" ]
    then
        echo "accounts.sh: ${_email} (${_role}) exists"
        return 0
    fi
    # Only the password is secret, and it is handed to jq in the environment.
    ACCOUNT_PASSWORD=${_password} jq -n --arg email "${_email}" '{
        username: $email,
        email: $email,
        enabled: true,
        emailVerified: true,
        credentials: [{ type: "password", value: env.ACCOUNT_PASSWORD, temporary: false }]
    }' | api_post /users > /dev/null
    if [ "${_role}" != "viewer" ]
    then
        _id=$(api_get "/users?exact=true&username=${_query}" | jq -r '.[0].id')
        api_get "/roles/${_role}" | jq '[.]' | api_post "/users/${_id}/role-mappings/realm" > /dev/null
    fi
    echo "accounts.sh: ${_email} (${_role}) created"
}

create_account admin "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}"
[ -n "${EDITOR_EMAIL}" ] && [ -n "${EDITOR_PASSWORD}" ] && create_account editor "${EDITOR_EMAIL}" "${EDITOR_PASSWORD}"
[ -n "${VIEWER_EMAIL}" ] && [ -n "${VIEWER_PASSWORD}" ] && create_account viewer "${VIEWER_EMAIL}" "${VIEWER_PASSWORD}"
exit 0
