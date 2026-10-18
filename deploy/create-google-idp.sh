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
# Keycloak, and no tokens are stored. The provider uses the first-login flow
# "avarc-first-broker-login", which the script creates once: it makes a new
# user without a role when no account has the email, and otherwise denies the
# login with a message that tells the user to sign in with the password and
# link the provider under Account, Linked accounts; an existing account is
# never linked automatically. Needs curl, jq and a running project; it
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

FLOW=avarc-first-broker-login
SUBFLOW=avarc-handle-existing-account
DENY_MESSAGE='An account with this email address already exists. Sign in with your password, then link Google under Account, Linked accounts.'

# Sets the requirement of the execution of the flow selected by the jq filter
# $1 (over the list of executions in ${_executions}).
set_requirement () {
    printf '%s' "${_executions}" | jq -c --arg requirement "$2" "first(.[] | select($1)) | .requirement = \$requirement" \
        | api_put "/authentication/flows/${FLOW}/executions" > /dev/null
}

# Creates the first-login flow once; an existing one is left as it is.
ensure_flow () {
    _flows=$(api_get /authentication/flows) || return 1
    if printf '%s' "${_flows}" | jq -e --arg alias "${FLOW}" 'any(.[]; .alias == $alias)' > /dev/null
    then
        return 0
    fi
    jq -n --arg alias "${FLOW}" '{alias: $alias, description: "Creates a user without a role, never links to an existing account", providerId: "basic-flow", topLevel: true, builtIn: false}' \
        | api_post /authentication/flows > /dev/null || return 1
    echo '{"provider": "idp-create-user-if-unique"}' \
        | api_post "/authentication/flows/${FLOW}/executions/execution" > /dev/null || return 1
    jq -n --arg alias "${SUBFLOW}" '{alias: $alias, type: "basic-flow", provider: "registration-page-form", description: "Denies the login of a user whose email has an account"}' \
        | api_post "/authentication/flows/${FLOW}/executions/flow" > /dev/null || return 1
    echo '{"provider": "deny-access-authenticator"}' \
        | api_post "/authentication/flows/${SUBFLOW}/executions/execution" > /dev/null || return 1
    _executions=$(api_get "/authentication/flows/${FLOW}/executions") || return 1
    set_requirement '.providerId == "idp-create-user-if-unique"' ALTERNATIVE || return 1
    set_requirement ".displayName == \"${SUBFLOW}\"" ALTERNATIVE || return 1
    set_requirement '.providerId == "deny-access-authenticator"' REQUIRED || return 1
    _deny=$(printf '%s' "${_executions}" | jq -r 'first(.[] | select(.providerId == "deny-access-authenticator")) | .id')
    jq -n --arg message "${DENY_MESSAGE}" '{alias: "avarc-deny-existing-account", config: {denyErrorMessage: $message}}' \
        | api_post "/authentication/executions/${_deny}/config" > /dev/null
}
ensure_flow

# Only the secret is secret, and it is handed to jq in the environment.
_provider=$(jq -n --arg id "${GOOGLE_CLIENT_ID}" --arg flow "${FLOW}" '{
    alias: "google",
    providerId: "google",
    enabled: true,
    trustEmail: false,
    storeToken: false,
    addReadTokenRoleOnCreate: false,
    linkOnly: false,
    firstBrokerLoginFlowAlias: $flow,
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
