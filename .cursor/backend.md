# Backend Development Rules

## Overview
This module (`avarc-backend`) is a Spring Boot application providing REST API services with a modular architecture using Spring Modulith.

## Technology Stack
- **Framework**: Spring Boot 4.0.1
- **Java**: Version 25
- **Architecture**: Spring Modulith 2.0.1 (modular monolith)
- **Security**: Spring Security
- **Database**: JPA with PostgreSQL/H2
- **API Documentation**: SpringDoc OpenAPI
- **Monitoring**: Spring Boot Actuator
- **Mapping**: MapStruct 1.6.3
- **JWT**: jjwt 0.12.6

## Architecture Principles
- Follow SOLID principles for object-oriented programming
- Use Spring Boot's built-in features for dependency management and configuration
- Implement RESTful services using Spring's MVC framework
- Use Spring Modulith for event-driven architecture
- Implement proper event handling and propagation
- Use event sourcing where appropriate

## Module Structure (Spring Modulith)
- **modules.authentication**: Authentication logic
- **modules.user**: User management
- **modules.security**: Security configuration
- **modules.dashboard**: Dashboard functionality
- **modules.monitoring**: Monitoring and metrics
- **config**: Application configuration

## Data Mapping & Transformation
- Use MapStruct for object mapping
- Create mapper interfaces with `@Mapper` annotation
- Use `@Mapper(componentModel = ComponentModel.SPRING)` for Spring integration
- Use `@Mapping` annotations for custom field mappings
- Keep mappers in dedicated mapper packages
- Document complex mapping logic
- Use `@AfterMapping` for post-mapping operations
- Implement proper null checks in mapping methods
- Use builder pattern for complex object creation
- Maintain separate mapper interfaces for different mapping scenarios
- Use `@Mapping(target = "fieldName", source = "sourceField")` for explicit field mappings
- Implement `@Mapping(target = "fieldName", ignore = true)` for fields to ignore
- Use `@Mapping(target = "fieldName", expression = "java(expression)")` for complex transformations
- Create mapper interfaces as abstract classes when custom implementation is needed
- Use `@Mapping(target = "fieldName", qualifiedByName = "methodName")` for custom mapping methods
- Implement proper error handling in custom mapping methods
- Use `@InheritInverseConfiguration` for bidirectional mappings
- Document mapping strategies in the mapper interface
- Use `@BeforeMapping` for pre-mapping operations
- Implement proper validation in mapping methods
- Use `@IterableMapping` for mapping collections and lists
- Implement proper null checks for collection mappings
- Use `qualifiedByName` for custom collection element mapping

## Internationalization
- Use MessageSource for message resolution
- Implement proper locale handling
- Store messages in properties files
- Use proper encoding (UTF-8)
- Implement fallback mechanisms
- Document translation requirements
- Use proper date/time formatting
- Handle number formatting
- Implement proper currency handling

## Exception Handling
- Use `@ControllerAdvice` for global exception handling
- Implement custom exception classes
- Use proper HTTP status codes
- Include meaningful error messages
- Log exceptions appropriately
- Handle validation exceptions
- Implement proper error responses

## Dependency Injection
- Use constructor injection for required dependencies
- Use setter injection for optional dependencies
- Avoid field injection
- Use `@Qualifier` for multiple implementations
- Implement proper scoping (`@Scope` annotations)
- Use `@Primary` for default implementations
- Document dependency requirements
- Avoid circular dependencies
- Use `@Configuration` for bean definitions
- Implement proper bean lifecycle management

## Caching Strategies
- Use Spring Cache abstraction for caching
- Implement `@Cacheable` for read operations
- Use `@CachePut` for update operations
- Implement `@CacheEvict` for delete operations
- Configure proper cache timeouts
- Use appropriate cache providers (Redis, Caffeine)
- Document cache invalidation strategies
- Monitor cache hit rates
- Implement cache warming strategies
- Use conditional caching with `unless` attribute

## API Documentation
- Use OpenAPI/Swagger for API documentation
- Keep API documentation up-to-date with code changes
- Include examples for all endpoints
- Document request/response schemas
- Add proper API versioning
- Include authentication requirements

## Database & Persistence
- Use JPA/Hibernate for database interactions
- Prefer Criteria API over raw SQL queries
- Configure transactions properly and use rollback for error handling
- Use spatial data efficiently utilizing PostGIS functions
- Apply proper indexing for spatial queries
- Implement connection pooling
- Regular backups of spatial data
- Optimize spatial queries

## Security & Authentication
- Implement JWT for authentication (currently, will migrate to Hydra)
- Use Spring Security for authorization
- Follow secure coding practices
- Will be replaced with Hydra token validation
- Will integrate with Kratos for user identity
- Will use Hydra OAuth2 clients for authentication
- Will update security configuration to validate Hydra tokens
- Will implement OAuth2 resource server pattern

## Logging & Monitoring
- Implement logging using SLF4J or Logback
- Configure proper log levels and appenders
- Set up monitoring and metrics collection
- Use Spring Boot Actuator for health checks and metrics

## Testing
- Write unit tests for all business logic
- Implement integration tests for API endpoints
- Use Spring Test for testing context
- Test module structure with Spring Modulith verification

## API Endpoints
- `/actuator/*`: Spring Boot Actuator endpoints
- `/v3/api-docs`: OpenAPI documentation
- `/swagger-ui.html`, `/swagger-ui/`: Swagger UI

## Communication Patterns
- Frontend and Backend identify objects via UUID
- Set the UUID in the service classes, not in the mapper
- Use consistent data structures across frontend and backend

## Integration Points
- **Backend ↔ Hydra**: Token validation and introspection
- **Backend ↔ Kratos**: User identity and profile management
- **Backend ↔ Database**: Shared PostgreSQL instance with `public` schema
- **Backend ↔ Frontend**: API calls proxied through frontend (not directly accessible from browser)

## Key Features
- Modular architecture with defined module dependencies
- REST API with OpenAPI documentation
- JWT-based authentication (will be adapted to Hydra)
- Database integration with JPA
- Actuator endpoints for health checks and metrics
- Module structure verification tests

