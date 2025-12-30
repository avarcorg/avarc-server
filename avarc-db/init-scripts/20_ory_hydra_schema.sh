#!/bin/bash

set -e

# Perform all actions as $POSTGRES_USER
export PGUSER="$POSTGRES_USER"

# Create the hydra schema for Ory Hydra
psql --dbname="$POSTGRES_DB" <<- EOSQL
-- Create the hydra schema for Ory Hydra
CREATE SCHEMA IF NOT EXISTS hydra;

-- Grant necessary permissions
GRANT ALL ON SCHEMA hydra TO "$POSTGRES_USER";
EOSQL

echo "Hydra schema created successfully."

