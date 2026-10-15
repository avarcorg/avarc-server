#!/bin/sh
# Creates one or more users in the running Keycloak of an environment.
#
#   deploy/create-user.sh [--stage] [--admin] [--permanent] EMAIL...
#                                               (SECRETS=dev|stage|prod)
#
# Without --admin the users are editors (they may also read, like every
# user); with --admin they are admins, who additionally manage users. Each
# new user gets a random one-time password, printed once as "EMAIL PASSWORD"
# on the standard output, and must change it at the first login. With
# --permanent the password is not generated but read for each user, hidden
# at a terminal prompt or else one line per user from the standard input
# (never from the command line), and it need not be changed. Nothing is
# printed then. Users that already exist are left alone.
# Needs the environment's secrets file (KEYCLOAK_ADMIN_PASSWORD), curl, jq
# and a running project; see create-admin-user.sh for the details of the
# connection, and spec/SPEC-auth.md.
set -e

PROG=create-user.sh
ENVIRONMENT=dev
ROLE=editor
PERMANENT=0
EMAILS=
for arg in "$@"
do
    case "${arg}" in
        --stage) ENVIRONMENT=stage ;;
        --admin) ROLE="admin" ;;
        --permanent) PERMANENT=1 ;;
        -h|--help) sed -n '2,/^set -e$/p' "$0" | sed -e '/^set -e$/d' -e 's/^# \{0,1\}//'; exit 0 ;;
        -*) echo "${PROG}: unknown argument '${arg}'" >&2; exit 1 ;;
        *@*) EMAILS="${EMAILS} ${arg}" ;;
        *) echo "${PROG}: '${arg}' is not an email address" >&2; exit 1 ;;
    esac
done
if [ -z "${EMAILS}" ]
then
    echo "${PROG}: give at least one email address (--help for usage)" >&2
    exit 1
fi
ENVIRONMENT=${SECRETS:-${ENVIRONMENT}}
P=$(dirname "$(realpath "$0")")
. "${P}/keycloak-lib.sh"
keycloak_setup

# read_password EMAIL: sets password from the terminal (hidden) or stdin.
read_password () {
    if [ -t 0 ]
    then
        printf 'Password for %s: ' "$1" >&2
        stty -echo
        IFS= read -r password || true
        stty echo
        echo >&2
    else
        IFS= read -r password || true
    fi
    if [ -z "${password}" ]
    then
        echo "${PROG}: no password given for $1" >&2
        exit 1
    fi
}

for email in ${EMAILS}
do
    if [ "${PERMANENT}" -eq 1 ]
    then
        read_password "${email}"
        mode=
    else
        password=$(head -c 256 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 20)
        mode=temporary
    fi
    # The message of create_account goes to stderr, so stdout stays the list
    # of new credentials.
    if create_account "${ROLE}" "${email}" "${password}" ${mode} >&2
    then
        [ "${PERMANENT}" -eq 1 ] || printf '%s %s\n' "$(printf '%s' "${email}" | tr '[:upper:]' '[:lower:]')" "${password}"
    else
        [ $? -eq 2 ] || exit 1
    fi
done
