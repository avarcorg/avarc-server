#!/bin/sh
# Creates the initial accounts in the running Keycloak of an environment. Safe
# to run repeatedly: accounts that already exist are left alone.
#
#   deploy/create-admin-user.sh [--dev|--stage|--prod]     (environment: see environment-lib.sh)
#
# The credentials come from the environment's secrets file (see run.sh):
# ADMIN_EMAIL and ADMIN_PASSWORD, and optionally EDITOR_EMAIL /
# EDITOR_PASSWORD and VIEWER_EMAIL / VIEWER_PASSWORD, plus the
# KEYCLOAK_ADMIN_PASSWORD that run.sh also needs. Accounts are created in
# the avarc realm; the email is the user name, and the role is a realm role.
# Needs curl, jq and a running project. It talks to Keycloak's port on the
# loopback interface; the passwords reach Keycloak in request bodies
# and never on a command line. Further users: create-user.sh. See
# spec/SPEC-auth.md.
set -e

PROG=create-admin-user.sh
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

if [ -z "${ADMIN_EMAIL}" ] || [ -z "${ADMIN_PASSWORD}" ]
then
    echo "${PROG}: ADMIN_EMAIL and ADMIN_PASSWORD are required in ${SECRETS_FILE}" >&2
    exit 1
fi

# An existing account is not an error here (create_account returns 2).
create_account admin "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}" || [ $? -eq 2 ]
if [ -n "${EDITOR_EMAIL}" ] && [ -n "${EDITOR_PASSWORD}" ]
then
    create_account editor "${EDITOR_EMAIL}" "${EDITOR_PASSWORD}" || [ $? -eq 2 ]
fi
if [ -n "${VIEWER_EMAIL}" ] && [ -n "${VIEWER_PASSWORD}" ]
then
    create_account viewer "${VIEWER_EMAIL}" "${VIEWER_PASSWORD}" || [ $? -eq 2 ]
fi
exit 0
