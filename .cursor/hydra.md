# Ory Hydra Configuration Rules

## Overview
This module (`avarc-ory-hydra`) provides Ory Hydra OAuth2 and OpenID Connect server configuration. Hydra handles OAuth2/OIDC flows, token management, and client administration.

## Architecture
- **Base Image**: `oryd/hydra:v${ory.version}` (version from parent POM property)
- **Configuration**: YAML-based configuration file (`hydra/hydra.yml`)
- **Database**: PostgreSQL with `ory` schema (configured via DSN environment variable)
- **Build**: Docker buildx with Maven resource filtering for version substitution

## Key Responsibilities
1. **OAuth2/OIDC Server**: Handles authorization and token endpoints
2. **Client Management**: Admin API for OAuth2 client CRUD operations
3. **Consent Flow**: Manages user consent challenges and sessions
4. **Token Management**: Issues and validates access tokens, refresh tokens, ID tokens

## Configuration Structure (`hydra.yml`)

### API Endpoints
- **Public API** (port 4444): OAuth2/OIDC endpoints for clients
  - `/.well-known/openid-configuration`: OIDC discovery
  - `/oauth2/auth`: Authorization endpoint
  - `/oauth2/token`: Token endpoint
  - `/oauth2/auth/sessions/consent/{challenge}`: Consent management
- **Admin API** (port 4445): Client and session management
  - `/admin/clients`: OAuth2 client CRUD
  - `/admin/oauth2/auth/sessions/consent/{challenge}`: Consent session management

### CORS Configuration
- Enabled for public API
- Allowed origins: `http://localhost:3000`, `http://localhost:8080`
- Supports standard HTTP methods (GET, POST, PUT, PATCH, DELETE, OPTIONS)
- Allows credentials

### URL Configuration
- `self.issuer`: Public URL of Hydra instance
- `consent`: URL of consent application
- `login`: URL of login application
- `error`: URL for error handling
- `logout`: URL for logout handling
- All URLs can be overridden via environment variables

### OAuth2 Settings
- Access token TTL: 1h
- Refresh token TTL: 720h (30 days)
- ID token TTL: 1h
- Auth code TTL: 10m
- Access token strategy: JWT
- Scope strategy: exact
- Hasher algorithm: bcrypt (cost: 10)

### OIDC Configuration
- Subject identifier types: pairwise, public
- Pairwise salt: configurable (default: "please-change-me-in-production")

## Environment Variables
- `DSN`: Database connection string (PostgreSQL with `ory` schema)
- `SECRETS_SYSTEM`: Secret key for cookie encryption (REQUIRED in production)
- `URLS_SELF_ISSUER`: Override issuer URL
- `URLS_CONSENT`: Override consent URL
- `URLS_LOGIN`: Override login URL
- `URLS_ERROR`: Override error URL
- `URLS_LOGOUT`: Override logout URL
- `OIDC_SUBJECT_IDENTIFIERS_PAIRWISE_SALT`: Override pairwise salt

## Database Configuration
- Uses PostgreSQL with `ory` schema (created by database init scripts)
- DSN format: `postgres://user:password@host:port/database?sslmode=disable&max_conns=20&max_idle_conns=4`
- Migrations run automatically via `hydra-migrate` container using `migrate sql` command

## Build Process
1. Maven resource filtering processes `Dockerfile` to substitute `${ory.version}`
2. Filtered Dockerfile stored in `target/docker/Dockerfile` (cleaned by `mvn clean`)
3. Docker buildx builds image using filtered Dockerfile
4. Configuration file copied to `/etc/config/hydra/hydra.yml` in container

## Dockerfile Structure
- Base: `oryd/hydra:v${ory.version}` (filtered at build time)
- Copies `hydra/hydra.yml` to `/etc/config/hydra/hydra.yml`
- Uses `chown=1000:1000` for proper file ownership

## Runtime Commands
- **Migration**: `migrate sql -e --yes -c /etc/config/hydra/hydra.yml`
- **Server**: `serve all -c /etc/config/hydra/hydra.yml --dev` (remove `--dev` in production)

## Integration Points
- **Frontend**: Handles login, consent, error, logout flows
- **Backend**: Validates OAuth2 tokens, integrates with user management
- **Database**: Stores clients, tokens, sessions in `ory` schema
- **NGINX**: Proxies public and admin APIs (when `ENABLE_HYDRA_PROXY=true`)

## Security Considerations
- **Production Checklist**:
  - [ ] Change `SECRETS_SYSTEM` secret
  - [ ] Change `OIDC_SUBJECT_IDENTIFIERS_PAIRWISE_SALT`
  - [ ] Configure proper CORS origins
  - [ ] Enable TLS/HTTPS
  - [ ] Remove `--dev` flag
  - [ ] Set up rate limiting
  - [ ] Configure monitoring and logging
  - [ ] Review OAuth2 client configurations
  - [ ] Secure admin API (IP whitelist, authentication)

## Development Guidelines
- Use environment variables to override configuration values
- Keep `hydra.yml` as base configuration with sensible defaults
- Version is managed via parent POM property `ory.version`
- Filtered Dockerfile must be in `target/docker` for proper cleanup
- Always use `--dev` flag only in development environments
- Log level set to `debug` in development (change to `info` or `warn` in production)

## Testing
- Verify OIDC discovery endpoint returns correct configuration
- Test OAuth2 authorization flow
- Validate token issuance and validation
- Test consent flow with frontend integration
- Verify database migrations run successfully
- Check CORS headers in responses

## Future Integration
- **Kratos**: Will share `ory` schema for user identity management
- **Backend**: Will validate tokens and integrate with user sessions
- **Frontend**: Will implement login/consent flows using Hydra endpoints

