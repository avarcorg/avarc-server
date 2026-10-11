# Architecture diagram

Source of truth for the system diagram required by
[SPEC-architecture-diagram.md](SPEC-architecture-diagram.md). Dashed borders
mark undecided components; dotted, muted borders mark components planned for
after the MVP. Dotted arrows are connections whose route is not decided yet
or that belong to post-MVP components. Each sub-application (frontend, backend, Ory
setup, ingress) may have its own, more detailed architecture diagram next to
its code.

```mermaid
flowchart TB
    Browser[Browser]
    AIClient["AI assistant<br/>MCP client (post-MVP)"]

    subgraph Server["avarc-server"]
        Ingress["Web server / ingress<br/>Caddy"]
        Frontend["Frontend<br/>Next.js"]
        Backend["Backend API<br/>Java/Kotlin (undecided)"]
        Ory["Ory<br/>(components undecided)"]
        MCP["MCP server<br/>(post-MVP)"]
        DB[("Database<br/>geo-capable (undecided)")]
    end

    Browser -- "HTTPS" --> Ingress
    Ingress -- "pages" --> Frontend
    Ingress -- "/api" --> Backend
    Ingress -- "/auth" --> Ory
    Frontend -. "HTTP API" .-> Backend
    Frontend -. "login/logout flows" .-> Ory
    Backend -- "validate session/identity" --> Ory
    Backend --> DB
    AIClient -. "MCP" .-> Ingress
    Ingress -. "MCP" .-> MCP
    MCP -. "API" .-> Backend
    MCP -. "validate session/identity" .-> Ory

    classDef undecided stroke-dasharray: 5 5;
    class Backend,Ory,DB undecided;

    classDef postmvp stroke-dasharray: 2 4,fill:#f4f4f4,stroke:#999,color:#666;
    class AIClient,MCP postmvp;
```
