---
name: validate-compose
description: Validate that the deploy/docker-compose*.template files render, merge and parse correctly after edits, with dummy values and without touching real secrets, data or containers. Use after any change to a Compose template.
---

Render the templates `deploy/docker-compose*.template` with dummy values and
let Docker Compose merge and parse them, as `run.sh` does: the core alone,
then the core with every feature template. Nothing is started, pulled or
created, and no secrets file is read.

Run this from the repo root:

```sh
export NAME=validate ENVIRONMENT=dev IMAGE_NAMESPACE=validate.example UPSTREAM_REGISTRY=docker.io \
    BACKEND_VERSION=0 FRONTEND_VERSION=0 INGRESS_VERSION=0 KEYCLOAK_VERSION=0 \
    P=/nonexistent/validate \
    SECRETS_RUN_DIR=/nonexistent/validate/secrets \
    DBTOOL_RUN_DIR=/nonexistent/validate/dbtool \
    RUN_UID=1000 INGRESS_PORT=18080 KEYCLOAK_ADMIN_PORT=18180 \
    PUBLIC_ORIGIN=http://localhost:18080 \
    KEYCLOAK_ADMIN_ORIGIN=http://localhost:18180 \
    FOOTER_API_DOCS=false FOOTER_DBTOOL_URL= FOOTER_KEYCLOAK_URL=

mkdir ./validate-compose.tmp
for t in deploy/docker-compose*.template
do
    envsubst < "$t" > "./validate-compose.tmp/$(basename "$t" .template).yml"
done
core=./validate-compose.tmp/docker-compose.yml

docker compose -f "$core" config > /dev/null \
    && echo "OK: core renders and parses"
for f in ./validate-compose.tmp/docker-compose.*.yml
do
    docker compose -f "$core" -f "$f" config > /dev/null \
        && echo "OK: core + $(basename "$f" .yml) merge and parse"
done

rm -rf ./validate-compose.tmp
```

Then check that every variable the templates use is set above (a variable
missing from the list renders as an empty string, which Compose often rejects
only in an obscure way):

```sh
cat deploy/docker-compose*.template | grep -o '\${[A-Z_]*}' | sort -u
```

If a template gains a variable, add a dummy value for it to the command.

Notes:
- Render **inside the repo**, not into `/tmp`: the Bash tool's sandbox has its
  own `/tmp`, which the Docker daemon cannot see.
- Always delete the temp directory afterwards, and never write to the
  `docker-compose.yml` of `deploy/`, the generated file `run.sh` writes (mode
  0600); the files above only share its name inside the temp directory.
- The check covers substitution and Compose syntax only. Healthchecks and
  `depends_on` conditions are parsed, not evaluated.
- Never source a real secrets file for this; the dummy values are enough.
- Keep real hosts, network names and addresses out of this file; the dummies
  must stay generic.
