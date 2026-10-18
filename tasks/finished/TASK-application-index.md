---
id: AVARC-58
type: task
status: finished
priority: low
area: frontend
depends-on: [AVARC-45]
created: 2026-10-18
---

# TASK: Application index at /.well-known/applications

Spec: [SPEC-frontend.md](../../spec/SPEC-frontend.md) ("Application index")

A page "Application Index" that lists the applications of an environment with
a link and a short description each, so nobody has to know the addresses. It
is announced at `/.well-known/applications`. It uses the same runtime
variables as the developer links of [AVARC-45](TASK-footer-dev-links.md),
so prod, which has none, shows nothing private: there the page answers 404
while the website is the only entry.

## To do

- A page `/<language>/applications`; `/.well-known/applications` redirects to
  it in the language of the browser (the proxy, which now skips paths with a
  dot).
- Entries: the website (`/`), the database tool, the Keycloak admin console,
  Swagger UI, the JSON API document and, where the API links are shown, the
  actuator. A one-line description per entry. All texts in `messages/en.json`.
- 404 when there is no entry besides the website.
- A later public application (the read-only map) adds its entry.

## Verification

On dev and stage the address `/.well-known/applications` leads to the page
with all enabled entries and no others; on prod (no variables set) it answers
404; the frontend build and `tools/check-messages.py` pass.
