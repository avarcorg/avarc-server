#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT schema_name FROM information_schema.schemata;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname avarc <<-EOSQL
    SELECT schema_name FROM information_schema.schemata;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname avarc_test <<-EOSQL
    SELECT schema_name FROM information_schema.schemata;
EOSQL

