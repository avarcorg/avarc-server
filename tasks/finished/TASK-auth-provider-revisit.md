---
id: AVARC-19
type: decision
status: finished
priority: high
area: auth
created: 2026-10-11
---

# TASK: Revisit the authentication provider and user administration

Spec: [SPEC-auth.md](../../spec/SPEC-auth.md)

Revisits [AVARC-13](TASK-ory-auth-design.md), which chose Ory
Kratos. Open question: is Kratos still the best choice for a small
application whose owner does not want to build account handling and an admin
area, and whose first public version must already have basic user
management?

Outcome: Keycloak, see Decision below.

## Requirements for the first public version

What "basic user management" means here, as the yardstick for the options:

1. An admin can create an account with a role (`viewer`, `editor`,
   `admin`); there is no self-registration.
2. An admin can list accounts and see their roles.
3. An admin can change a role and disable or delete an account.
4. An admin can reset a password without depending on an email service
   (email is not part of the MVP).
5. Users can log in and out; changing the own password is wanted, not
   strictly required.
6. For the MVP, administration may be shell-script based. A web admin UI is
   welcome but optional.
7. Login and account screens work in English and German (global decision in
   [SPEC.md](../../SPEC.md)).
8. Self-hosted, modest resource use on a small host, a licence that does not
   constrain the open [licensing decision](../TASK-licensing-decision.md).
9. Fits the single-origin ingress and a Next.js frontend; the backend stack
   (Java/Kotlin) is still undecided
   ([AVARC-4](TASK-backend-stack-decision.md)).
10. The post-MVP MCP server needs token-based access for AI assistants.

## Where the Kratos decision stands

Kratos is a headless identity service: it provides the flows and the API,
and no user interface at all. Nothing of it is built yet; the repository has
only the ingress route for `/auth/` to a placeholder service. What would
have to be built is exactly the part this revisit is about:

- Frontend pages for login, error and, for requirement 5, settings (change
  password) and recovery, each rendered from the flow's JSON nodes, including
  German texts mapped from message IDs.
- Scripts beyond account creation: list, set role, disable, reset password
  (the admin API can create a recovery link without email).
- Roles live in `metadata_public`, with no admin UI for them.
- Token access for the MCP server would need another Ory component (Hydra).

Everything backend- and frontend-side is blocked on the skeletons
([AVARC-3](../TASK-backend-skeleton.md), [AVARC-6](../TASK-frontend-skeleton.md)),
so deciding now costs no integration work.

## Options

Licences were verified on 2026-10-11 (see Licensing check). Resource
figures are from general knowledge and must be verified when the decision
is taken.

### A. Keep Kratos, administer with scripts

- Advantages: the design of the previous decision (AVARC-13); very light (one Go
  process, shares the existing PostgreSQL server); Apache-2.0; plain cookie
  sessions with a simple backend check; scripts can do everything through
  the admin API; no email service needed (admin-created recovery links).
- Disadvantages: we build every user-facing screen and its German text;
  administration is scripts only; the MVP stays minimal in practice (no
  self-service password change until the settings page exists); the MCP
  server later needs Hydra or a custom token scheme.
- Effort left: login, error, settings and recovery pages; four or five
  admin scripts; backend session check.

### B. Keycloak

- Advantages: complete admin console (users, roles, password reset,
  disable); hosted login, account and password pages with English and
  German built in and themeable; OIDC/OAuth2 with tokens, so the MCP server
  needs nothing extra; scriptable (`kcadm.sh`) and a declarative realm
  import for the shell-based MVP; Apache-2.0; very large community and
  first-class Spring/Quarkus support, and the Next.js side has a ready
  provider. The backend would validate signed tokens locally instead of
  calling `whoami`.
- Disadvantages: heavy (a JVM service, typically a few hundred MB of RAM up
  to about 1 GB); a large configuration surface and frequent upgrades; login
  pages are Keycloak's, not ours, unless themed; replaces the Ory design, so
  spec, ingress, deployment and diagram change; an OIDC login flow in the
  frontend instead of Kratos's cookie flow.
- Effort: realm import, one service, OIDC login in Next.js, token validation
  in the backend, a provisioning script via `kcadm.sh`.

### C. Zitadel

- Advantages: single Go binary on PostgreSQL; admin console, hosted login,
  API first; OIDC and machine users for the MCP server; English and German
  texts.
- Disadvantages: AGPL-3.0-only (verified), which interacts with the open
  licensing decision; younger and fast-moving, with major changes to its
  login UI; smaller community than Keycloak; the same OIDC rework as B.

### D. Pocket ID

- Advantages: very small; admin UI; OIDC; one-time login links make
  onboarding and password-less "reset" trivial; groups available as claims.
- Disadvantages: passkeys only, no passwords, which every user must be able
  to use; a young project with a small maintainer base; a thin role model
  (groups to claims); the same OIDC rework as B.

### E. Authentik

- Advantages: admin UI, flexible flows, OIDC.
- Disadvantages: several processes plus PostgreSQL (older versions also
  Redis); aimed at SSO across many applications, far more than needed here;
  the same OIDC rework as B.

### F. Own minimal accounts in the backend

A users table, password hashes (Argon2/bcrypt), sessions, an admin command
or script.

- Advantages: no extra service and no extra database; roles are plain data;
  our own screens in both languages; administration by script is trivial.
- Disadvantages: we own password storage, rate limiting, lockout, reset,
  session handling and CSRF; contradicts the current requirement that the
  application does not store passwords; blocked on the undecided backend;
  every later need (MFA, MCP tokens, password change) is ours to build.

### Variant: external login only (GitHub, Google) plus an allowlist

No passwords at all; roles and the allowlist live in our database. Smallest
build, but depends on third-party accounts for every user and still needs
role administration. Not recommended for a project about local history with
non-technical contributors.

### Not considered further

Authelia: file-based users and no admin UI, so it saves nothing over
Kratos. Caddy basic auth: no accounts, roles or reset.

## Comparison

| Criterion | A Kratos | B Keycloak | C Zitadel | D Pocket ID | F Own |
|-----------|----------|------------|-----------|-------------|-------|
| Admin UI | none | full | full | yes | none (build) |
| User-facing screens | build all | provided | provided | provided | build all |
| English / German | build | provided | provided | provided | build |
| Password reset without email | admin link | admin | admin | login link | script |
| Resource use | very low | high | low-medium | very low | none extra |
| MCP tokens later | needs Hydra | included | included | included | build |
| Licence | Apache-2.0 | Apache-2.0 | AGPL-3.0 | permissive | own |
| Maturity, community | high | highest | medium | low | n/a |
| Rework of the Ory design | none | large | large | large | large |
| Security burden on us | low | low | low | low | high |

## Assessment

The deciding question is who builds the account screens and the admin area.
Kratos is the best choice when you want your own UI and a very small
footprint; it is the weakest fit for "I do not want to build account setup
and administration". Its remaining work is mostly the screens and scripts
that B and C ship. Option F is the cheapest to run and the most expensive to
get right, and is not recommended. D is attractive but forces passkeys on
all users.

Recommendation: **B (Keycloak)** if the host can spare roughly 1 GB of RAM;
otherwise stay with **A (Kratos)**, scoped to login, a settings page and
admin scripts, and accept that a web admin UI is a later task. C is the
alternative to B if the AGPL turns out to be acceptable under the licensing
decision and the footprint matters.

## Licensing check

Verified on 2026-10-11 against the upstream repositories.

| Product | Licence | Notes |
|---------|---------|-------|
| Keycloak | Apache-2.0 | No exceptions or gated features. |
| Kratos | Apache-2.0 | Some features (B2B organisations, multi-tenancy) exist only in Ory's commercial builds; none are needed here. |
| Zitadel | AGPL-3.0-only | Its own licensing policy leaves compliance to the user and offers a commercial licence; only `proto/` and docs (Apache-2.0) and the login app and client packages (MIT) are exceptions. |

- Apache-2.0 products (Keycloak, Kratos) used unmodified as separate
  services place no obligation on this project's code, whichever licence
  [AVARC-9](../TASK-licensing-decision.md) picks. The repository's current
  `LICENSE` template is Apache-2.0 as well.
- Zitadel under the AGPL is manageable for an unmodified deployment reached
  over the network, but it adds a compliance question (modifications, source
  offer to network users) that the project would have to answer and monitor,
  and the vendor itself advises legal review. That is a cost the Apache-2.0
  options do not have. This is a reading of the licence text, not legal
  advice.

## Decision

**B (Keycloak)**, confirmed by the owner. Reasons:

- It is the only option that is both feature-complete (admin console, hosted
  login and account pages in English and German, password reset without
  email, tokens for the later MCP server) and free of licence questions
  (Apache-2.0; Zitadel is AGPL-3.0-only).
- Resources are not a constraint for the development and staging hosts; the
  production host's capacity remains to be evaluated and is an open question
  in the spec.
- Nothing of the backend or frontend integration exists yet, so changing the
  provider costs only the Ory design, which has not been built.

Kratos (A) was the fallback had production turned out too small.

## Outcome

- `spec/SPEC-auth.md` records the Keycloak decisions; `SPEC.md`, the ingress,
  frontend, deployment, locations and architecture-diagram specs and the
  diagram are updated.
- [AVARC-13](TASK-ory-auth-design.md) and
  [AVARC-14](TASK-ory-integration.md) are superseded and not carried out
  further.
- The implementation is [AVARC-20](../TASK-keycloak-integration.md).
