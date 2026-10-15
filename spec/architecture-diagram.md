# Architecture diagram

Source of truth for the system diagram required by
[SPEC-architecture-diagram.md](SPEC-architecture-diagram.md). Dashed borders
mark undecided components; dotted, muted borders mark components planned for
after the MVP. Dotted arrows are connections whose route is not decided yet
or that belong to post-MVP components. Each sub-application (frontend, backend, Keycloak
setup, ingress) may have its own, more detailed architecture diagram next to
its code.

```mermaid
flowchart TB
    Browser[Browser]
    AIClient["AI assistant<br/>MCP client (post-MVP)"]

    subgraph Server["avarc-server"]
        Ingress["Web server / ingress<br/>nginx"]
        Frontend["Frontend<br/>Next.js"]
        Backend["Backend API<br/>Spring Boot + Modulith"]
        Keycloak["Keycloak"]
        MapServer["Public read-only map server<br/>(post-MVP)"]
        MCP["MCP server<br/>(post-MVP)"]
        DB[("Database<br/>PostgreSQL + PostGIS")]
    end

    Browser -- "HTTPS" --> Ingress
    Ingress -- "pages" --> Frontend
    Ingress -- "/api" --> Backend
    Ingress -- "/auth (realm endpoints)" --> Keycloak
    Frontend -. "HTTP API" .-> Backend
    Frontend -. "OIDC login/logout" .-> Keycloak
    Backend -- "signing keys (token validation)" --> Keycloak
    Backend --> DB
    Anonymous["Anonymous public<br/>(post-MVP)"]
    Anonymous -. "HTTPS" .-> Ingress
    Ingress -. "map" .-> MapServer
    MapServer -. "public data" .-> DB
    AIClient -. "MCP" .-> Ingress
    Ingress -. "MCP" .-> MCP
    MCP -. "API" .-> Backend
    MCP -. "validate token" .-> Keycloak

    classDef undecided stroke-dasharray: 5 5;

    classDef postmvp stroke-dasharray: 2 4,fill:#f4f4f4,stroke:#999,color:#666;
    class AIClient,MCP,MapServer,Anonymous postmvp;
```
