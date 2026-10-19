#!/bin/bash
# Container entrypoint of the keycloak service: writes the database and
# bootstrap admin settings from /run/secrets into a configuration file in
# the container's temporary storage (mode 0600), then starts Keycloak in
# production mode. The client secret reaches only the Keycloak process, as
# the placeholder value of the realm import. See spec/SPEC-auth.md.
set -e

case "$-" in *x*) _xtrace=on ;; *) _xtrace=off ;; esac
set +x

# Escapes a value for a Java properties file.
esc () {
    _v=${1//\\/\\\\}
    printf '%s' "${_v}"
}

CONFIG=/tmp/avarc-keycloak.conf
rm -f "${CONFIG}"
( umask 077
  printf 'db-password=%s\n' "$(esc "$(cat /run/secrets/POSTGRES_PASSWORD)")" > "${CONFIG}"
  printf 'bootstrap-admin-password=%s\n' "$(esc "$(cat /run/secrets/KEYCLOAK_ADMIN_PASSWORD)")" >> "${CONFIG}" )
AVARC_CLIENT_SECRET=$(cat /run/secrets/KEYCLOAK_CLIENT_SECRET)
export AVARC_CLIENT_SECRET

[ "${_xtrace}" = on ] && set -x

# The build-time options (database vendor, health endpoints, metrics,
# relative path) are part of the image. Logs are JSON. There is no access
# log of its own: it cannot leave out the query string, which carries login
# session codes, and the ingress logs every request with the request ID.
# Login and admin events are not logged either (a failed login names the
# login name); they are kept in the event store of the realm and counted in
# the metrics.
exec /opt/keycloak/bin/kc.sh --config-file="${CONFIG}" start --optimized \
    --import-realm \
    --log-console-output=json \
    --db-url=jdbc:postgresql://db:5432/keycloak \
    --db-username=avarc \
    --bootstrap-admin-username=keycloak-admin \
    --http-enabled=true \
    --hostname="${PUBLIC_ORIGIN}/auth" \
    --hostname-admin="${ADMIN_ORIGIN}/auth" \
    --proxy-headers=xforwarded
