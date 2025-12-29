#!/bin/bash

set -e

# Perform all actions as $POSTGRES_USER
export PGUSER="$POSTGRES_USER"

# Create the 'ory' schema for Hydra and Kratos
"${psql[@]}" --dbname="$POSTGRES_DB" <<- 'EOSQL'
-- Create the ory schema for Ory Hydra and Kratos
CREATE SCHEMA IF NOT EXISTS ory;

-- Grant necessary permissions
GRANT ALL ON SCHEMA ory TO "$POSTGRES_USER";

-- Set default search_path for the user to include ory schema
-- This allows Hydra and Kratos to use the ory schema by default
ALTER USER "$POSTGRES_USER" SET search_path = ory, public;
EOSQL

echo "Ory schema created successfully."

