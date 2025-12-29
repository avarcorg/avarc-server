# Frontend and Backend Overview

## Note
This is a brief overview. Detailed cursorrules will be created when these components are adapted to integrate with Hydra and Kratos.

## Frontend (`avarc-frontend`)

### Technology Stack
- **Framework**: Next.js 15.3.0
- **React**: 19.1.0
- **Styling**: Tailwind CSS 3.4.1
- **i18n**: next-i18next, i18next, react-i18next
- **HTTP Client**: Axios 1.9.0
- **JWT**: jwt-decode 4.0.0
- **Translation**: Crowdin CLI integration

### Structure
- **Pages**: Next.js pages router (`pages/` directory)
- **Components**: React components in `components/` directory
- **Hooks**: Custom React hooks in `hooks/` directory
- **Services**: API service layer in `services/` directory
- **Utils**: Utility functions in `utils/` directory
- **Config**: Next.js and i18n configuration files

### Key Features
- Internationalization (i18n) with multiple languages
- Authentication flow (currently custom, will be adapted to Hydra/Kratos)
- Protected routes using `withAuth` HOC
- Navigation component with authentication state
- Dashboard component
- Translation management via Crowdin

### Current Authentication
- Uses JWT tokens (jwt-decode)
- Custom authentication flow
- Will be replaced with OAuth2/OIDC flow via Hydra

### Future Integration
- Replace custom auth with Hydra OAuth2/OIDC flow
- Integrate with Kratos for user identity management
- Implement consent flow for OAuth2
- Update token handling to use Hydra tokens

## Backend (`avarc-backend`)

### Technology Stack
- **Framework**: Spring Boot 3.5.0
- **Java**: Version 24
- **Architecture**: Spring Modulith (modular monolith)
- **Security**: Spring Security
- **Database**: JPA with PostgreSQL/H2
- **API Documentation**: SpringDoc OpenAPI
- **Monitoring**: Spring Boot Actuator
- **Mapping**: MapStruct 1.6.3
- **JWT**: jjwt 0.12.6

### Module Structure (Spring Modulith)
- **modules.authentication**: Authentication logic
- **modules.user**: User management
- **modules.security**: Security configuration
- **modules.dashboard**: Dashboard functionality
- **modules.monitoring**: Monitoring and metrics
- **config**: Application configuration

### Key Features
- Modular architecture with defined module dependencies
- REST API with OpenAPI documentation
- JWT-based authentication (will be adapted to Hydra)
- Database integration with JPA
- Actuator endpoints for health checks and metrics
- Module structure verification tests

### Current Authentication
- Custom JWT token generation and validation
- Spring Security integration
- Will be replaced with Hydra token validation

### Future Integration
- Replace JWT generation with Hydra token validation
- Integrate with Kratos for user identity
- Use Hydra OAuth2 clients for authentication
- Update security configuration to validate Hydra tokens
- Implement OAuth2 resource server pattern

### API Endpoints
- `/actuator/*`: Spring Boot Actuator endpoints
- `/v3/api-docs`: OpenAPI documentation
- `/swagger-ui.html`, `/swagger-ui/`: Swagger UI

## Integration Points
- **Frontend ↔ Hydra**: OAuth2/OIDC authorization flow
- **Frontend ↔ Backend**: API calls with Hydra access tokens
- **Backend ↔ Hydra**: Token validation and introspection
- **Backend ↔ Kratos**: User identity and profile management
- **All ↔ Database**: Shared PostgreSQL instance with separate schemas

## Migration Strategy
1. Keep existing functionality working
2. Add Hydra/Kratos integration alongside current auth
3. Gradually migrate authentication flows
4. Update token handling incrementally
5. Remove old authentication code once migration complete

