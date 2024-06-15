#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER avarc;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE avarc;
    GRANT ALL PRIVILEGES ON DATABASE avarc TO avarc;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname avarc <<-EOSQL
    CREATE SCHEMA IF NOT EXISTS avarc;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE avarc_test;
    GRANT ALL PRIVILEGES ON DATABASE avarc_test TO avarc;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname avarc_test <<-EOSQL
    CREATE SCHEMA IF NOT EXISTS avarc;
EOSQL
