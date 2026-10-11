# Architecture diagram

Source of truth for the system diagram required by
[SPEC-architecture-diagram.md](SPEC-architecture-diagram.md). Dashed borders
mark undecided components. Each sub-application (frontend, backend, Ory
setup, ingress) may have its own, more detailed architecture diagram next to
its code.

```mermaid
flowchart TB
    Browser[Browser]

    subgraph Server["avarc-server"]
        Ingress["Web server / ingress<br/>(product undecided)"]
        Frontend["Frontend<br/>Next.js"]
        Backend["Backend API<br/>Java/Kotlin (undecided)"]
        Ory["Ory<br/>(components undecided)"]
        DB[("Database<br/>geo-capable (undecided)")]
    end

    Browser -- "HTTPS" --> Ingress
    Ingress -- "pages" --> Frontend
    Ingress -- "API" --> Backend
    Ingress -- "auth flows" --> Ory
    Frontend -. "HTTP API" .-> Backend
    Frontend -. "login/logout flows" .-> Ory
    Backend -- "validate session/identity" --> Ory
    Backend --> DB

    classDef undecided stroke-dasharray: 5 5;
    class Ingress,Backend,Ory,DB undecided;
```
