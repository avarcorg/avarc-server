#!/bin/sh
# Restores the users of the avarc realm from an export of export-keycloak-users.sh into
# the running Keycloak of an environment, through the partialImport endpoint,
# with their original ids, provider links and realm roles. Users that exist
# are skipped, so running it again changes nothing. See spec/SPEC-auth.md,
# "Surviving a rebuild of Keycloak's data".
#
#   deploy/restore-keycloak-users.sh [--dev|--stage|--prod] [FILE]  (environment: see environment-lib.sh)
#
# FILE defaults to the newest keycloak-users-*.json in the backups directory
# of the environment (data/<environment>/backups next to this script,
# BACKUP_DIR overrides it). The realm and the identity providers of the links
# must exist first (create-google-idp.sh); the script stops when one is
# missing. Passwords are not in the export: each user it creates without a
# provider link gets a new one-time password, printed once as "EMAIL PASSWORD"
# on the standard output, to be changed at the first login. Needs the
# environment's secrets file (KEYCLOAK_ADMIN_PASSWORD), curl, jq and a running
# project; see create-admin-user.sh for the connection.
set -e

PROG=restore-keycloak-users.sh
. "$(dirname "$(realpath "$0")")/environment-lib.sh"
ENVIRONMENT=
FILE=
for arg in "$@"
do
    case "${arg}" in
        --dev) ENVIRONMENT=dev ;;
        --stage) ENVIRONMENT=stage ;;
        --prod) ENVIRONMENT=prod ;;
        -h|--help) sed -n '2,/^set -e$/p' "$0" | sed -e '/^set -e$/d' -e 's/^# \{0,1\}//'; exit 0 ;;
        -*) echo "${PROG}: unknown argument '${arg}'" >&2; exit 1 ;;
        *) FILE=${arg} ;;
    esac
done
ENVIRONMENT=${ENVIRONMENT:-${SECRETS:-$(default_environment)}}
P=$(dirname "$(realpath "$0")")
BACKUP_DIR=${BACKUP_DIR:-${P}/data/${ENVIRONMENT}/backups}
if [ -z "${FILE}" ]
then
    FILE=$(ls -1 "${BACKUP_DIR}"/keycloak-users-*.json 2> /dev/null | sort | tail -n 1)
    if [ -z "${FILE}" ]
    then
        echo "${PROG}: no keycloak-users-*.json in ${BACKUP_DIR}" >&2
        exit 1
    fi
fi
if ! jq -e '.users | type == "array"' "${FILE}" > /dev/null 2>&1
then
    echo "${PROG}: ${FILE} is not an export of users" >&2
    exit 1
fi

. "${P}/keycloak-lib.sh"
keycloak_setup
login

# Every provider of a link must exist already.
_have=$(api_get /identity-provider/instances | jq -r '.[].alias') || exit 1
for _alias in $(jq -r '[.users[].federatedIdentities[]?.identityProvider] | unique[]' "${FILE}")
do
    case "
${_have}
" in
        *"
${_alias}
"*) ;;
        *) echo "${PROG}: the identity provider '${_alias}' does not exist in ${REALM}; create it first" >&2; exit 1 ;;
    esac
done

# A new password for every user without a link; only those the import
# creates are reported. The passwords stay in a file of the work directory.
printf '{}' > "${WORK}/passwords.json"
jq -r '.users[] | select((.federatedIdentities // []) | length == 0) | .username' "${FILE}" \
    | while IFS= read -r _name
do
    _password=$(head -c 256 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 20)
    PASSWORD=${_password} jq --arg name "${_name}" '. + {($name): env.PASSWORD}' "${WORK}/passwords.json" > "${WORK}/passwords.next"
    mv "${WORK}/passwords.next" "${WORK}/passwords.json"
done

jq --slurpfile passwords "${WORK}/passwords.json" '{
    ifResourceExists: "SKIP",
    users: [.users[] | if ((.federatedIdentities // []) | length) == 0
        then . + {credentials: [{type: "password", value: $passwords[0][.username], temporary: true}], requiredActions: ["UPDATE_PASSWORD"]}
        else . end]
}' "${FILE}" | api_post /partialImport > "${WORK}/result.json" || exit 1

jq -r --slurpfile passwords "${WORK}/passwords.json" '
    .results[] | select(.resourceType == "USER" and .action == "ADDED")
    | .resourceName as $name | select($passwords[0][$name] != null)
    | "\($name) \($passwords[0][$name])"' "${WORK}/result.json"
echo "${PROG}: $(jq -r '"\(.added) added, \(.skipped) skipped, \(.overwritten) overwritten"' "${WORK}/result.json") (${FILE})" >&2
