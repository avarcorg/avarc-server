# Cursor Rules Directory

This directory contains component-specific rules and guidelines for the AvArc server project. Each file focuses on a single responsibility to help maintain clear, focused documentation.

## Files

- **`nginx.md`**: NGINX reverse proxy configuration rules
  - Routing, security headers, upstream services
  - Paketo Buildpacks integration

- **`database.md`**: PostgreSQL/PostGIS database setup rules
  - PostGIS extension initialization
  - Ory schema configuration for Hydra/Kratos
  - Schema isolation strategy

- **`hydra.md`**: Ory Hydra OAuth2/OIDC server rules
  - Configuration structure and endpoints
  - Environment variables and security
  - Integration points with frontend/backend

- **`frontend-backend-overview.md`**: Brief overview of frontend and backend
  - Technology stacks and current architecture
  - Future integration plans with Hydra/Kratos
  - Migration strategy notes

## Usage

These rules are automatically loaded by Cursor when working on the respective components. They provide context about:
- Architecture and design decisions
- Configuration patterns
- Security considerations
- Development guidelines
- Integration points

## Adding New Rules

When adding new component-specific rules:
1. Create a new file in this directory with a descriptive name
2. Focus on a single responsibility per file
3. Include architecture, configuration, and development guidelines
4. Update this README with a brief description

