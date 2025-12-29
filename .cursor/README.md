# Cursor Rules Directory

This directory contains component-specific rules and guidelines for the AvArc server project. Each file focuses on a single responsibility to help maintain clear, focused documentation.

## Files

- **`nginx.md`**: NGINX reverse proxy configuration rules
  - Routing, security headers, upstream services
  - Paketo Buildpacks integration
  - Infrastructure guidelines and best practices

- **`database.md`**: PostgreSQL/PostGIS database setup rules
  - PostGIS extension initialization
  - Ory schema configuration for Hydra/Kratos
  - Schema isolation strategy
  - PostGIS best practices and optimization

- **`hydra.md`**: Ory Hydra OAuth2/OIDC server rules
  - Configuration structure and endpoints
  - Environment variables and security
  - Integration points with frontend/backend

- **`frontend.md`**: Frontend development rules
  - Next.js configuration and conventions
  - Styling guidelines (Tailwind CSS)
  - Component structure and naming
  - API request flow and security architecture
  - Internationalization setup

- **`backend.md`**: Backend development rules
  - Spring Boot architecture and best practices
  - Spring Modulith module structure
  - Data mapping with MapStruct
  - Dependency injection patterns
  - Caching and performance strategies

- **`project.md`**: Project structure and configuration
  - Monorepo organization
  - Technology stack overview
  - Module structure

- **`recommendations.md`**: General recommendations and best practices
  - Security, performance, and maintenance guidelines
  - Development process recommendations
  - Monitoring and documentation standards

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

