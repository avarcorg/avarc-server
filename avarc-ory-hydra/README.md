# Ory Hydra Configuration

This directory contains configuration files for Ory Hydra (OAuth2 and OpenID Connect server).

## Directory Structure

```
avarc-ory-hydra/
├── hydra/
│   └── hydra.yml              # Hydra main configuration
└── pom.xml                     # Maven module configuration
```

## Quick Reference

### Hydra Endpoints

**Public API (Port 4444)**
- `GET /.well-known/openid-configuration` - OpenID Connect discovery
- `POST /oauth2/auth` - Authorization endpoint
- `POST /oauth2/token` - Token endpoint
- `GET /oauth2/auth/sessions/consent/{challenge}` - Get consent request
- `PUT /oauth2/auth/sessions/consent/{challenge}` - Accept consent

**Admin API (Port 4445)**
- `GET /admin/clients` - List OAuth2 clients
- `POST /admin/clients` - Create OAuth2 client
- `GET /admin/clients/{id}` - Get OAuth2 client
- `PUT /admin/clients/{id}` - Update OAuth2 client
- `DELETE /admin/clients/{id}` - Delete OAuth2 client
- `GET /admin/oauth2/auth/sessions/consent/{challenge}` - Get consent request
- `PUT /admin/oauth2/auth/sessions/consent/{challenge}` - Accept consent

## Configuration Files

### hydra.yml

Main configuration for Hydra. Key sections:
- `serve`: API endpoints configuration
- `dsn`: Database connection string (set via environment variable)
- `urls`: URL configuration for issuer, consent, login
- `secrets`: Secret keys for encryption

## Environment Variables

Set these in your environment or `docker-compose.yml`:

- `HYDRA_DB_PASSWORD`: PostgreSQL password for Hydra database
- `HYDRA_SECRETS_SYSTEM`: Secret key for Hydra (cookie encryption, etc.)
- `HYDRA_URLS_SELF_ISSUER`: Public URL of Hydra instance
- `HYDRA_URLS_CONSENT`: URL of consent application
- `HYDRA_URLS_LOGIN`: URL of login application

## Database Migrations

Migrations are automatically run when the service starts:
- Hydra: `hydra-migrate` container runs `migrate sql`

## Production Checklist

- [ ] Change all secrets in configuration
- [ ] Configure proper CORS origins
- [ ] Enable TLS/HTTPS
- [ ] Set up proper session management
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Review OAuth2 client configurations
- [ ] Configure proper network security


