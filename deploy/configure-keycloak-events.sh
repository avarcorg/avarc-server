#!/bin/sh
# Sets the event logging of the avarc realm in the running Keycloak of an
# environment: login events (logins, failed logins, brute-force lockouts) and
# admin events (user, role and password changes, without their content) are
# kept in the realm's event store for 30 days, which admins read in the
# console under Events. They are not written to the logs, because a failed
# login names the login name. A new realm gets these settings from the
# realm import file; this script is for a realm that already exists, since
# Keycloak imports the file only when the realm is absent. Safe to run
# repeatedly.
#
#   deploy/configure-keycloak-events.sh [--dev|--stage|--prod]     (environment: see environment-lib.sh)
#
# Needs curl, jq and a running project, like create-google-idp.sh. See
# spec/SPEC-auth.md.
set -e

PROG=configure-keycloak-events.sh
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
login

printf '%s' '{"eventsEnabled": true, "eventsExpiration": 2592000, "eventsListeners": [], "adminEventsEnabled": true, "adminEventsDetailsEnabled": false}' \
    | api_put "/events/config" > /dev/null
echo "${PROG}: event logging is set for the realm ${REALM} of ${ENVIRONMENT}"
