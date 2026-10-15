---
id: AVARC-45
type: task
status: open
priority: normal
area: frontend
depends-on: [AVARC-41]
created: 2026-10-15
---

# TASK: Developer links in the footer on non-prod

Spec: [SPEC-frontend.md](../spec/SPEC-frontend.md),
[SPEC-deployment.md](../spec/SPEC-deployment.md)

On the dev and stage environments the footer of the website shows links to
the tools that exist there, so a developer or tester does not have to know
the addresses. On prod the footer shows none of them.

## Links

Each link appears only if its target is enabled in that environment:

- **Database tool:** the web database tool, served when `DB_TAILNET=true`
  ([SPEC-deployment.md](../spec/SPEC-deployment.md)).
- **Swagger UI:** `/api/docs`, served on dev and stage.
- **JSON API document:** `/api/docs/openapi.json`, served on dev and stage.

## Specification phase

Before code, the specs record:

- How the frontend learns which links to show: from the environment at
  runtime (not baked into the image, which is the same for every
  environment), for example variables passed to the frontend service by
  `run.sh`/the Compose template, or a small backend endpoint. Decide which,
  keeping `run.sh` small.
- The database tool address is derived from `PUBLIC_ORIGIN` and the
  environment name as already documented, not configured a second time.
- Nothing about hosts or networks goes into the repository beyond what the
  specs already state.

## Acceptance

- On dev and stage with the tools enabled, the footer links to each of them;
  a tool that is not enabled has no link.
- On prod the footer has no such links, and the page source and the
  frontend config do not reveal them.
- The footer stays usable on a phone and in the light and dark appearance.
- The decisions are in the specs before or together with the code.
