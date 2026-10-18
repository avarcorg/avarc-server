#!/bin/sh
# Exports the users of the avarc realm of the running Keycloak of an
# environment into a JSON file, a second protection next to the database
# dumps (see spec/SPEC-auth.md, "Surviving a rebuild of Keycloak's data").
#
#   deploy/export-keycloak-users.sh [--dev|--stage|--prod]          (environment: see environment-lib.sh)
#
# Per user: id, username, email, emailVerified, names, enabled, attributes,
# the links to identity providers (provider, provider's user id and name) and
# the realm roles, without the default role every user has. Passwords are not
# available through the Admin API and are not exported. The file
# keycloak-users-<yyyymmdd-hhmmss>.json goes to the backups directory of the
# environment (data/<environment>/backups next to this script, BACKUP_DIR
# overrides it), mode 0600 because it holds personal data, and appears under
# its final name only when complete. backup-db.sh runs this script. Needs the
# environment's secrets file (KEYCLOAK_ADMIN_PASSWORD), curl, jq and a running
# project; see create-admin-user.sh for the connection.
set -e

PROG=export-keycloak-users.sh
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
P=$(dirname "$(realpath "$0")")
. "${P}/keycloak-lib.sh"
keycloak_setup

BACKUP_DIR=${BACKUP_DIR:-${P}/data/${ENVIRONMENT}/backups}
umask 077
mkdir -p "${BACKUP_DIR}"
login

# The users page by page; each is completed with its links and roles. The
# personal data goes through files and standard input, not command lines.
: > "${WORK}/users.ndjson"
_first=0
_max=100
while :
do
    _page=$(api_get "/users?first=${_first}&max=${_max}&briefRepresentation=false") || exit 1
    printf '%s' "${_page}" | jq -c '.[]' > "${WORK}/page.ndjson"
    _count=$(wc -l < "${WORK}/page.ndjson")
    while IFS= read -r _user
    do
        _id=$(printf '%s' "${_user}" | jq -r '.id')
        api_get "/users/${_id}/federated-identity" > "${WORK}/links.json" || exit 1
        api_get "/users/${_id}/role-mappings/realm" > "${WORK}/roles.json" || exit 1
        printf '%s' "${_user}" | jq -c --slurpfile links "${WORK}/links.json" --slurpfile roles "${WORK}/roles.json" --arg default "default-roles-${REALM}" '{
            id, username, email, emailVerified, firstName, lastName, enabled,
            createdTimestamp, attributes,
            federatedIdentities: ($links[0] | map({identityProvider, userId, userName})),
            realmRoles: ($roles[0] | map(.name) | map(select(. != $default)))
        } | with_entries(select(.value != null))' >> "${WORK}/users.ndjson"
    done < "${WORK}/page.ndjson"
    [ "${_count}" -ge "${_max}" ] || break
    _first=$((_first + _max))
done

TARGET=${BACKUP_DIR}/keycloak-users-$(date +%Y%m%d-%H%M%S).json
jq -s --arg realm "${REALM}" --arg at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{realm: $realm, exportedAt: $at, users: .}' "${WORK}/users.ndjson" > "${TARGET}.part"
mv "${TARGET}.part" "${TARGET}"
echo "${PROG}: exported $(jq '.users | length' "${TARGET}") users of ${REALM} into ${TARGET}" >&2
