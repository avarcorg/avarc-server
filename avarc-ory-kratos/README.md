# Ory Kratos Configuration

This directory contains configuration files for Ory Kratos (identity and user management server).

## Directory Structure

```
avarc-ory-kratos/
├── kratos/
│   ├── kratos.yml              # Kratos main configuration
│   └── identity.schema.json    # Identity schema definition
└── pom.xml                     # Maven module configuration
```

## Quick Reference

### Kratos Endpoints

**Public API (Port 4433)**
- `GET /.well-known/ory/kratos/public` - Public API discovery
- `POST /self-service/login` - Initiate login flow
- `GET /self-service/login` - Get login flow
- `POST /self-service/registration` - Initiate registration flow
- `GET /self-service/registration` - Get registration flow
- `POST /self-service/logout` - Logout
- `GET /self-service/verification` - Get verification flow
- `POST /self-service/verification` - Initiate verification flow
- `GET /self-service/recovery` - Get recovery flow
- `POST /self-service/recovery` - Initiate recovery flow
- `GET /sessions/whoami` - Get current session

**Admin API (Port 4434)**
- `GET /admin/identities` - List identities
- `POST /admin/identities` - Create identity
- `GET /admin/identities/{id}` - Get identity
- `PUT /admin/identities/{id}` - Update identity
- `DELETE /admin/identities/{id}` - Delete identity
- `GET /admin/sessions` - List sessions
- `DELETE /admin/sessions/{id}` - Delete session

## Configuration Files

### kratos.yml

Main configuration for Kratos. Key sections:
- `serve`: API endpoints configuration
- `dsn`: Database connection string (set via environment variable)
- `selfservice`: Self-service flows configuration (login, registration, recovery, verification)
- `identity`: Identity schema configuration
- `secrets`: Secret keys for encryption
- `session`: Session management configuration

### identity.schema.json

JSON Schema definition for identity traits. Defines:
- Required fields (email)
- Optional fields (name.first, name.last)
- Credential configuration
- Verification and recovery settings

## Environment Variables

Set these in your environment or `docker-compose.yml`:

- `KRATOS_DB_PASSWORD`: PostgreSQL password for Kratos database
- `KRATOS_SECRETS_COOKIE`: Secret key for cookie encryption
- `KRATOS_SECRETS_CIPHER`: Secret key for data encryption
- `KRATOS_SERVE_PUBLIC_BASE_URL`: Public URL of Kratos instance
- `KRATOS_SERVE_ADMIN_BASE_URL`: Admin URL of Kratos instance
- `KRATOS_SELFSERVICE_DEFAULT_BROWSER_RETURN_URL`: Default return URL after flows

## Database Migrations

Migrations are automatically run when the service starts:
- Kratos: `kratos-migrate` container runs `migrate sql -e --yes`

## Production Checklist

- [ ] Change all secrets in configuration
- [ ] Configure proper CORS origins
- [ ] Enable TLS/HTTPS
- [ ] Set up proper session management
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure email courier for verification/recovery
- [ ] Review identity schema configuration
- [ ] Configure proper network security
- [ ] Set up backup strategy for identity data

