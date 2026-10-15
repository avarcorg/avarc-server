# The Keycloak of this project: the pinned upstream image with the realm
# import, the start script and the build-time options. Nothing
# environment-specific or secret is in it. See spec/SPEC-auth.md.
FROM quay.io/keycloak/keycloak:26.8.0

# Build-time options, applied once here so that the start is --optimized.
ENV KC_DB=postgres \
    KC_HEALTH_ENABLED=true \
    KC_HTTP_RELATIVE_PATH=/auth
RUN /opt/keycloak/bin/kc.sh build

COPY avarc-realm.json /opt/keycloak/data/import/avarc-realm.json
COPY --chmod=0755 keycloak-start.sh /opt/avarc/keycloak-start.sh

ENTRYPOINT ["/bin/bash", "/opt/avarc/keycloak-start.sh"]
