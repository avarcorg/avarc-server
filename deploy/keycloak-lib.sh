# Shared by create-admin-user.sh and create-user.sh; sourced, not run. The
# caller sets PROG (its name, for messages), ENVIRONMENT (dev, stage or prod)
# and P (this directory), then calls keycloak_setup. Needs curl and jq.
# The request headers sit in a file only the owner can read, and the
# passwords reach Keycloak in request bodies, never on a command line.

# keycloak_setup: reads the secrets file, finds the running Keycloak and
# waits for it. Sets SECRETS_FILE, BASE, WORK and the secrets file variables.
keycloak_setup () {
    case "${ENVIRONMENT}" in
        dev)   SECRETS_FILE=secrets.dev.sh ;;
        stage) SECRETS_FILE=secrets.stage.sh ;;
        prod)  SECRETS_FILE=secrets.sh ;;
        *) echo "${PROG}: SECRETS must be dev, stage or prod, not '${ENVIRONMENT}'" >&2; exit 1 ;;
    esac
    SECRETS_FILE=${P}/${SECRETS_FILE}
    _container=$(docker compose -p "avarc-${ENVIRONMENT}" ps -q keycloak)
    if [ -z "${_container}" ]
    then
        echo "${PROG}: the keycloak service of avarc-${ENVIRONMENT} is not running" >&2
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
    _port=$(docker compose -p "avarc-${ENVIRONMENT}" port keycloak 8080 | sed 's/.*://')
    BASE=http://127.0.0.1:${_port}/auth

    if [ -z "${KEYCLOAK_ADMIN_PASSWORD}" ]
    then
        echo "${PROG}: KEYCLOAK_ADMIN_PASSWORD is required in ${SECRETS_FILE}" >&2
        exit 1
    fi

    WORK=$(umask 077; mktemp -d)
    trap 'rm -rf "${WORK}"' EXIT

    # Waits until the master realm answers; right after a start it may not yet.
    _tries=0
    until curl -s -o /dev/null --fail "${BASE}/realms/master"
    do
        _tries=$((_tries + 1))
        if [ "${_tries}" -ge 30 ]
        then
            echo "${PROG}: Keycloak does not answer on ${BASE}" >&2
            exit 1
        fi
        sleep 2
    done
}

# Writes an Authorization header for the master realm admin to ${WORK}/auth.
# The secrets file exports the password, so it is read from the environment.
login () {
    _response=$(jq -rn '"grant_type=password&client_id=admin-cli&username=keycloak-admin&password=" + (env.KEYCLOAK_ADMIN_PASSWORD | @uri)' \
        | curl -sS --data @- "${BASE}/realms/master/protocol/openid-connect/token") || true
    _token=$(printf '%s' "${_response}" | jq -r '.access_token // empty' 2>/dev/null) || true
    if [ -z "${_token}" ]
    then
        # The error body names the reason (error, error_description); it
        # holds no secret.
        echo "${PROG}: login to Keycloak as keycloak-admin failed: $(printf '%s' "${_response}" | jq -r '[.error, .error_description] | map(select(. != null)) | join(": ")' 2>/dev/null || true)" >&2
        exit 1
    fi
    ( umask 077; printf 'header = "Authorization: Bearer %s"\n' "${_token}" > "${WORK}/auth" )
}

# api_get PATH: GET below the avarc realm's admin API; the answer goes to the
# standard output. On an error it prints Keycloak's message to the standard
# error and returns 1 (callers may run where "set -e" does not apply, so
# every call is checked).
api_get () {
    _out=$(curl -sS -w '\n%{http_code}' -K "${WORK}/auth" "${BASE}/admin/realms/${REALM}$1") || return 1
    api_result "$1"
}

# api_post PATH: POST the JSON on the standard input; same error handling.
api_post () {
    _out=$(curl -sS -w '\n%{http_code}' -K "${WORK}/auth" -H 'Content-Type: application/json' \
        --data-binary @- "${BASE}/admin/realms/${REALM}$1") || return 1
    api_result "$1"
}

# api_result PATH: prints the body of ${_out} (body, newline, HTTP status),
# or the error message when the status is not 2xx.
api_result () {
    _status=${_out##*
}
    _body=${_out%
*}
    case "${_status}" in
        2??) printf '%s\n' "${_body}" ;;
        *)
            echo "${PROG}: Keycloak answered ${_status} for $1: $(printf '%s' "${_body}" | jq -r '.errorMessage // .error_description // .error // empty' 2>/dev/null)" >&2
            return 1 ;;
    esac
}

# create_account ROLE EMAIL PASSWORD [temporary]
# ROLE is viewer, editor or admin (the roles include each other, see
# SPEC-auth.md). With "temporary" the user must change the password at the
# first login. Returns 0 when created, 2 when the account already exists.
create_account () {
    _role=$1
    _email=$(printf '%s' "$2" | tr '[:upper:]' '[:lower:]')
    _password=$3
    _temporary=false
    [ "$4" = temporary ] && _temporary=true
    login || return 1
    _query=$(printf '%s' "${_email}" | jq -sRr @uri)
    _found=$(api_get "/users?exact=true&username=${_query}") || return 1
    _id=$(printf '%s' "${_found}" | jq -r '.[0].id // empty')
    if [ -n "${_id}" ]
    then
        echo "${PROG}: ${_email} (${_role}) exists"
        return 2
    fi
    # Only the password is secret, and it is handed to jq in the environment.
    ACCOUNT_PASSWORD=${_password} jq -n --arg email "${_email}" --argjson temporary "${_temporary}" '{
        username: $email,
        email: $email,
        enabled: true,
        emailVerified: true,
        credentials: [{ type: "password", value: env.ACCOUNT_PASSWORD, temporary: $temporary }]
    }' | api_post /users > /dev/null || return 1
    if [ "${_role}" != "viewer" ]
    then
        _found=$(api_get "/users?exact=true&username=${_query}") || return 1
        _id=$(printf '%s' "${_found}" | jq -r '.[0].id // empty')
        [ -n "${_id}" ] || { echo "${PROG}: ${_email} not found after creation" >&2; return 1; }
        _roledef=$(api_get "/roles/${_role}") || return 1
        printf '%s' "${_roledef}" | jq '[.]' | api_post "/users/${_id}/role-mappings/realm" > /dev/null || return 1
    fi
    echo "${PROG}: ${_email} (${_role}) created"
}
