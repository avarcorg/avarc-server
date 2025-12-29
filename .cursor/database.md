# Database Configuration Rules

## Overview
This module (`avarc-db`) provides PostgreSQL database initialization scripts with PostGIS extensions and Ory schema setup for Hydra and Kratos.

## Architecture
- **Database**: PostgreSQL with PostGIS extensions
- **Initialization**: Bash scripts executed during PostgreSQL container initialization
- **Schema Management**: Separate schemas for application data and Ory services

## Key Responsibilities
1. **PostGIS Setup**: Initialize PostGIS extensions for geospatial data
2. **Ory Schema**: Create dedicated schema for Ory Hydra and Kratos
3. **Template Database**: Create PostGIS template for new databases
4. **User Permissions**: Configure schema permissions and search paths

## File Structure
- `init-scripts/10_postgis.sh`: PostGIS extension initialization
- `init-scripts/20_ory_schema.sh`: Ory schema creation for Hydra/Kratos

## PostGIS Initialization (`10_postgis.sh`)
- Creates `template_postgis` template database
- Loads PostGIS extensions into template and main database:
  - `postgis`: Core PostGIS functionality
  - `postgis_topology`: Topology support
  - `fuzzystrmatch`: Fuzzy string matching
  - `postgis_tiger_geocoder`: TIGER geocoding support
- Handles reconnection to update pg_setting.resetval (see postgis/docker-postgis#288)

## Ory Schema Initialization (`20_ory_schema.sh`)
- Creates `ory` schema for Ory Hydra and Kratos
- Grants all permissions on `ory` schema to `$POSTGRES_USER`
- Sets default `search_path` to include `ory` and `public` schemas
- Allows Hydra and Kratos to use the `ory` schema by default

## Environment Variables
- `POSTGRES_USER`: Database user (default: postgres)
- `POSTGRES_DB`: Main database name
- `POSTGRES_PASSWORD`: Database password (not used in scripts, handled by container)

## Script Execution Order
1. `10_postgis.sh` runs first (alphabetical order)
2. `20_ory_schema.sh` runs second
3. Scripts use `set -e` for error handling
4. All actions performed as `$POSTGRES_USER`

## Database Schema Strategy
- **public schema**: Application data (AvArc application tables)
- **ory schema**: Ory services (Hydra, Kratos) tables
- **search_path**: `ory, public` - allows queries without schema prefix for Ory services

## Development Guidelines
- Always use `CREATE SCHEMA IF NOT EXISTS` for idempotency
- Use `CREATE EXTENSION IF NOT EXISTS` for extensions
- Grant permissions explicitly to `$POSTGRES_USER`
- Maintain script execution order (use numeric prefixes)
- Use heredoc syntax (`<<- 'EOSQL'`) for SQL blocks
- Export `PGUSER` environment variable for psql commands
- Use `${psql[@]}` array for psql command execution

## Migration Strategy
- Ory services (Hydra, Kratos) handle their own migrations via `migrate sql` command
- Application migrations should be handled separately (not in init scripts)
- Init scripts only set up schemas and extensions, not application tables

## Security Considerations
- Schema isolation: Ory services use separate schema
- Permissions: Only `$POSTGRES_USER` has access to `ory` schema
- Search path: Prevents accidental cross-schema queries

## Testing
- Verify PostGIS extensions are loaded correctly
- Confirm `ory` schema exists and has correct permissions
- Test that `search_path` includes both schemas
- Verify template database creation

