#!/bin/sh
# Creates or updates the Google identity provider in the running Keycloak of
# an environment, so that the login page of the avarc realm offers Google.
# Safe to run repeatedly: an existing provider is updated to the values described here,
# which is also how a changed client secret is applied.
#
#   deploy/create-google-idp.sh [--stage]     (SECRETS=dev|stage|prod as for run.sh)
#
# The OAuth client of the environment comes from its secrets file (see
# run.sh): GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, plus the
# KEYCLOAK_ADMIN_PASSWORD that run.sh also needs. The provider has the alias
# "google", so its redirect URI is
# <origin>/auth/realms/avarc/broker/google/endpoint. Only the scopes openid,
# email and profile are requested, the email is not trusted as verified by
# Keycloak, and no tokens are stored. Needs curl, jq and a running project; it
# talks to Keycloak's port on the loopback interface, and the secret reaches
# Keycloak in a request body, never on a command line. See create-admin-user.sh
# and spec/SPEC-auth.md.
set -e

PROG=create-google-idp.sh
ENVIRONMENT=dev
for arg in "$@"
do
    case "${arg}" in
        --stage) ENVIRONMENT=stage ;;
        -h|--help) sed -n '2,/^set -e$/p' "$0" | sed -e '/^set -e$/d' -e 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "${PROG}: unknown argument '${arg}'" >&2; exit 1 ;;
    esac
done
ENVIRONMENT=${SECRETS:-${ENVIRONMENT}}
P=$(dirname "$(realpath "$0")")
. "${P}/keycloak-lib.sh"
keycloak_setup

if [ -z "${GOOGLE_CLIENT_ID}" ] || [ -z "${GOOGLE_CLIENT_SECRET}" ]
then
    echo "${PROG}: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required in ${SECRETS_FILE}" >&2
    exit 1
fi

login

# Only the secret is secret, and it is handed to jq in the environment.
_provider=$(jq -n --arg id "${GOOGLE_CLIENT_ID}" '{
    alias: "google",
    providerId: "google",
    enabled: true,
    trustEmail: false,
    storeToken: false,
    addReadTokenRoleOnCreate: false,
    linkOnly: false,
    firstBrokerLoginFlowAlias: "first broker login",
    config: {
        clientId: $id,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        defaultScope: "openid email profile",
        syncMode: "IMPORT",
        hideOnLoginPage: "false"
    }
}')

# The answer to the question whether it exists is the status, so the error
# message of a missing provider is not shown.
if api_get /identity-provider/instances/google > /dev/null 2>&1
then
    printf '%s' "${_provider}" | api_put /identity-provider/instances/google > /dev/null
    echo "${PROG}: google identity provider updated"
else
    printf '%s' "${_provider}" | api_post /identity-provider/instances > /dev/null
    echo "${PROG}: google identity provider created"
fi
