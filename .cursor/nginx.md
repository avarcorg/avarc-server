# NGINX Reverse Proxy Configuration Rules

## Overview
This module (`avarc-nginx`) provides a reverse proxy using NGINX with Paketo Buildpacks. It routes requests to backend services including frontend, backend API, Hydra, and Adminer.

## Architecture
- **Build**: Uses Paketo Buildpacks (`paketobuildpacks/builder-jammy-base` with `docker.io/paketobuildpacks/nginx`)
- **Configuration**: `nginx.conf` uses Paketo template syntax (`{{env "VAR"}}` and `{{port}}`)
- **MIME Types**: `mime.types` file is copied from resources during build

## Key Responsibilities
1. **Reverse Proxy Routing**: Routes requests to appropriate upstream services
2. **Security Headers**: Implements security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
3. **Request Logging**: JSON-formatted access logs with configurable exclusions
4. **Protocol Handling**: Properly handles X-Forwarded-Proto for HTTPS behind proxies

## Configuration Structure

### Upstream Services
- `backend`: Spring Boot backend API (configurable via `APP_BACKEND_HOST`/`APP_BACKEND_PORT`)
- `frontend`: Next.js frontend (configurable via `APP_FRONTEND_HOST`/`APP_FRONTEND_PORT`)
- `adminer`: Database admin tool (configurable via `APP_ADMINER_HOST`/`APP_ADMINER_PORT`)
- `hydra_public`: Ory Hydra public API (conditional, via `ENABLE_HYDRA_PROXY`)
- `hydra_admin`: Ory Hydra admin API (conditional, via `ENABLE_HYDRA_PROXY`)

### Location Blocks
- `/actuator`: Spring Boot Actuator endpoints
- `/v3/api-docs`, `/swagger-ui.html`, `/swagger-ui/`: OpenAPI documentation
- `/adminer/`: Database administration interface
- `/hydra/`: Ory Hydra public API (OAuth2/OIDC endpoints) - conditional
- `/hydra-admin/`: Ory Hydra admin API (client management) - conditional
- `/`: Default route to frontend (Next.js)

## Environment Variables
- `NGINX_PORT`: Port for NGINX to listen on
- `APP_BACKEND_HOST`, `APP_BACKEND_PORT`: Backend service location
- `APP_FRONTEND_HOST`, `APP_FRONTEND_PORT`: Frontend service location
- `APP_ADMINER_HOST`, `APP_ADMINER_PORT`: Adminer service location
- `ENABLE_HYDRA_PROXY`: Enable Hydra proxy routes ("true" to enable)
- `APP_HYDRA_PUBLIC_HOST`, `APP_HYDRA_PUBLIC_PORT`: Hydra public API location
- `APP_HYDRA_ADMIN_HOST`, `APP_HYDRA_ADMIN_PORT`: Hydra admin API location

## Security Considerations
- **Production TODO**: Secure `/actuator`, `/swagger-ui`, `/adminer`, and `/hydra-admin` endpoints
- **Hydra Admin API**: Should be restricted with IP whitelist, authentication, and rate limiting
- **Hydra Public API**: Consider rate limiting and IP-based restrictions
- All security headers are set at server level

## Build Process
1. Maven resources plugin copies `mime.types` to project root during `prepare-package`
2. Paketo `pack` CLI builds Docker image using NGINX buildpack
3. Buildpack processes `nginx.conf` template at runtime
4. Image uses `BP_NGINX_CONF_PATH=nginx.conf` and `BP_NGINX_STATIC_ROOT=.`

## Development Guidelines
- Use Paketo template syntax for environment variable substitution
- Maintain JSON logging format for structured logs
- Exclude noisy paths from logging (webpack-hmr, favicon.ico)
- Always set proper proxy headers for upstream services
- Use `proxy_http_version 1.1` for HTTP/1.1 connections
- Support WebSocket upgrades for frontend (Upgrade, Connection headers)

## Infrastructure Guidelines
- Configure as reverse proxy (primary function)
- Implement load balancing when multiple backend instances are available
- Set up SSL/TLS for production environments
- Configure secure HTTP headers (already implemented)
- Optimize performance settings (worker processes, connections)
- Set up proper logging (JSON format implemented)
- Implement caching strategies for static content
- Monitor performance and adjust configuration as needed

## Testing
- Verify all upstream services are reachable
- Test conditional Hydra proxy routes
- Validate security headers in responses
- Check JSON log format output
- Verify protocol forwarding (X-Forwarded-Proto)

