# Project Structure and Configuration

## Overview
AvArc is a monorepo project containing multiple modules for a complete application stack.

## Monorepo Structure
This is a Maven-based monorepo with the following packages:

### Backend Package
- **Path**: `avarc-backend`
- **Language**: Java
- **Type**: backend
- **Entry Point**: `src/main/java/org/avarc/server/backend/AvarcBackendApplication.java`
- **Test Path**: `src/test/java`
- **Package Manager**: Maven

### Frontend Package
- **Path**: `avarc-frontend`
- **Language**: JavaScript
- **Type**: frontend
- **Entry Point**: `pages/index.js`
- **Test Path**: `__tests__`
- **Package Manager**: npm

### Infrastructure Packages
- **Path**: `avarc-nginx`
- **Language**: nginx
- **Type**: infrastructure
- **Entry Point**: `nginx.conf`

- **Path**: `avarc-ory-hydra`
- **Type**: infrastructure
- **Purpose**: OAuth2/OIDC server

- **Path**: `avarc-db`
- **Type**: infrastructure
- **Purpose**: Database initialization scripts

## Technology Stack
- Spring Boot
- Java
- React.js
- PostGIS
- NGINX
- Docker
- Redis (planned)

## Global Ignore Patterns
- `**/node_modules/**`
- `**/build/**`
- `**/.next/**`
- `**/.idea/**`
- `**/target/**`
- `**/.git/**`
- `**/*.bak`

## Project Organization
- Each module is a separate Maven module or npm package
- Shared configuration in parent POM
- Common build scripts and CI/CD configuration
- Shared documentation and development guidelines

