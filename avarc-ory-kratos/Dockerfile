ARG ORY_VERSION=latest
FROM oryd/kratos:v${ORY_VERSION}

# Copy Kratos configuration
COPY --chown=1000:1000 kratos/kratos.yml /etc/config/kratos/kratos.yml
COPY --chown=1000:1000 kratos/identity.schema.json /etc/config/kratos/identity.schema.json

