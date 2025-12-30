# Database Configuration Rules

## Overview
This module (`avarc-db`) provides PostgreSQL database initialization scripts with PostGIS extensions and Ory schema setup for Hydra and Kratos.

## Architecture
- **Database**: PostgreSQL with PostGIS extensions
- **Initialization**: Bash scripts executed during PostgreSQL container initialization
- **Schema Management**: Separate schemas for application data, Kratos, and Hydra

## Key Responsibilities
1. **PostGIS Setup**: Initialize PostGIS extensions for geospatial data
2. **Ory Schemas**: Create dedicated schemas for Ory Kratos and Ory Hydra
3. **Template Database**: Create PostGIS template for new databases
4. **User Permissions**: Configure schema permissions and search paths

## File Structure
- `init-scripts/10_postgis.sh`: PostGIS extension initialization
- `init-scripts/20_ory_hydra_schema.sh`: Hydra schema creation
- `init-scripts/20_ory_kratos_schema.sh`: Kratos schema creation

## PostGIS Initialization (`10_postgis.sh`)
- Creates `template_postgis` template database
- Loads PostGIS extensions into template and main database:
  - `postgis`: Core PostGIS functionality
  - `postgis_topology`: Topology support
  - `fuzzystrmatch`: Fuzzy string matching
  - `postgis_tiger_geocoder`: TIGER geocoding support
- Handles reconnection to update pg_setting.resetval (see postgis/docker-postgis#288)

## Ory Schema Initialization

### Hydra Schema (`20_ory_hydra_schema.sh`)
- Creates `hydra` schema for Ory Hydra
- Grants all permissions on `hydra` schema to `$POSTGRES_USER`
- Hydra service uses `hydra` schema via `search_path` parameter in DSN connection string

### Kratos Schema (`20_ory_kratos_schema.sh`)
- Creates `kratos` schema for Ory Kratos
- Grants all permissions on `kratos` schema to `$POSTGRES_USER`
- Kratos service uses `kratos` schema via `search_path` parameter in DSN connection string

## Environment Variables
- `POSTGRES_USER`: Database user (default: postgres)
- `POSTGRES_DB`: Main database name
- `POSTGRES_PASSWORD`: Database password (not used in scripts, handled by container)

## Script Execution Order
1. `10_postgis.sh` runs first (alphabetical order)
2. `20_ory_hydra_schema.sh` runs second (alphabetical order)
3. `20_ory_kratos_schema.sh` runs third (alphabetical order)
4. Scripts use `set -e` for error handling
5. All actions performed as `$POSTGRES_USER`

## Database Schema Strategy
- **public schema**: Application data (AvArc application tables)
- **kratos schema**: Ory Kratos tables (identity and user management)
- **hydra schema**: Ory Hydra tables (OAuth2 and OpenID Connect)
- **search_path**: Set per-service via DSN connection string parameter (`search_path=kratos` or `search_path=hydra`)

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
- Schema isolation: Ory services use separate schemas (kratos and hydra)
- Permissions: Only `$POSTGRES_USER` has access to `kratos` and `hydra` schemas
- Search path: Each service uses its own schema via DSN parameter, preventing accidental cross-schema queries

## PostGIS Best Practices
- Use spatial data efficiently utilizing PostGIS functions
- Apply proper indexing for spatial queries (GIST indexes)
- Implement connection pooling (configured via DSN parameters)
- Regular backups of spatial data
- Optimize spatial queries for performance
- Monitor database performance and query execution times
- Use appropriate spatial data types (geometry, geography)
- Leverage PostGIS functions for spatial operations

## Testing
- Verify PostGIS extensions are loaded correctly
- Confirm `kratos` and `hydra` schemas exist and have correct permissions
- Test that each service uses its respective schema via DSN `search_path` parameter
- Verify template database creation
- Test spatial queries and PostGIS functions
- Validate spatial indexes are created and used

