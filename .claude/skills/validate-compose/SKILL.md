---
name: validate-compose
description: Validate that deploy/docker-compose.template renders and parses correctly after edits, with dummy values and without touching real secrets, data or containers. Use after any change to deploy/docker-compose.template.
---

Render `deploy/docker-compose.template` with dummy values and let Docker
Compose parse the result. Nothing is started, pulled or created, and no
secrets file is read.

Run this from the repo root:

```sh
NAME=validate \
ENVIRONMENT=dev \
IMAGE_NAMESPACE=validate.example \
BACKEND_VERSION=0 FRONTEND_VERSION=0 INGRESS_VERSION=0 KEYCLOAK_VERSION=0 \
P=/nonexistent/validate \
SECRETS_RUN_DIR=/nonexistent/validate/secrets \
DBTOOL_RUN_DIR=/nonexistent/validate/dbtool \
RUN_UID=1000 \
INGRESS_PORT=18080 KEYCLOAK_ADMIN_PORT=18180 \
PUBLIC_ORIGIN=http://localhost:18080 \
KEYCLOAK_ADMIN_ORIGIN=http://localhost:18180 \
FOOTER_API_DOCS=false FOOTER_DBTOOL_URL= FOOTER_KEYCLOAK_URL= \
DB_DOCKTAIL_ENABLE=false \
COMPOSE_PROFILES=dbtool \
envsubst < deploy/docker-compose.template > ./validate-compose.yml.tmp

docker compose -f ./validate-compose.yml.tmp config >/dev/null \
    && echo "OK: template renders and parses"

rm -f ./validate-compose.yml.tmp
```

`COMPOSE_PROFILES=dbtool` includes the optional database tool, so that every
service is checked.

Then check that every variable the template uses is set above (a variable
missing from the list renders as an empty string, which Compose often rejects
only in an obscure way):

```sh
grep -o '\${[A-Z_]*}' deploy/docker-compose.template | sort -u
```

If the template gains a variable, add a dummy value for it to the command.

Notes:
- Render **inside the repo**, not into `/tmp`: the Bash tool's sandbox has its
  own `/tmp`, which the Docker daemon cannot see.
- Always delete the temp file afterwards, and never reuse the name
  `docker-compose.yml`, the generated file `run.sh` writes (mode 0600).
- The check covers substitution and Compose syntax only. Healthchecks and
  `depends_on` conditions are parsed, not evaluated.
- Never source a real secrets file for this; the dummy values are enough.
- Keep real hosts, network names and addresses out of this file; the dummies
  must stay generic.
