#!/bin/bash

set -e

# Perform all actions as $POSTGRES_USER
export PGUSER="$POSTGRES_USER"

# Create the kratos schema for Ory Kratos
"${psql[@]}" --dbname="$POSTGRES_DB" <<- 'EOSQL'
-- Create the kratos schema for Ory Kratos
CREATE SCHEMA IF NOT EXISTS kratos;

-- Grant necessary permissions
GRANT ALL ON SCHEMA kratos TO "$POSTGRES_USER";
EOSQL

echo "Kratos schema created successfully."

