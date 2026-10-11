# avarc-server
An application to collect data of historical interest, with locations and descriptions

## Running it

Requires Docker with Compose and `envsubst`.

    deploy/run.sh up       # dev: start in the foreground (add -d to detach);
                           # open http://localhost:8080/
    deploy/run.sh down     # stop, keep data
    deploy/run.sh reset    # dev: stop and delete local data and dev secrets
    deploy/run.sh logs -f  # any other argument goes to "docker compose"
    deploy/run.sh --stage up  # stage (what the systemd unit runs)
    deploy/run.sh --help   # usage (also without arguments)

Dev secrets are generated on the first start; stage and prod need their
secrets file (`deploy/secrets.stage.sh`, `deploy/secrets.sh`) first. Local
data and secrets stay under `deploy/` and are gitignored. Only the ingress
and the database run so far; the other services are added as their projects
are created. Details: `spec/SPEC-deployment.md`.
