---
id: AVARC-43
type: task
status: open
priority: low
area: auth
depends-on: [AVARC-32, AVARC-41]
created: 2026-10-15
---

# TASK: Keycloak theme

Spec: [SPEC-auth.md](../spec/SPEC-auth.md),
[SPEC-frontend.md](../spec/SPEC-frontend.md)

The pages that Keycloak serves (login, required actions such as the
password change, errors) use its default theme, while the website has its
own look ([AVARC-41](finished/TASK-website-layout.md)). The login form has to
stay with Keycloak ([SPEC-auth.md](../spec/SPEC-auth.md)), so the pages are
not rebuilt in the frontend; a custom Keycloak theme gives them the look of
the site.

## Specification phase

Before code, `SPEC-auth.md` records the decisions below, and the colours and
fonts are stated once, shared with `SPEC-frontend.md`, not described twice.

- Which pages the theme covers: the login theme first. The account console
  and the emails are decided here and may stay on the default.
- How far the theme goes: only CSS, logo and texts on top of Keycloak's
  built-in theme (the starting point), or overridden templates as well. The
  templates are only overridden when the CSS cannot do it, because every
  Keycloak upgrade must then re-check them.

## Suggested implementation

- **Theme:** a theme `avarc` in the module `avarc-server-keycloak`, copied
  into the image (`/opt/keycloak/themes/avarc`) by the Dockerfile and
  extending Keycloak's built-in theme (`parent=keycloak.v2`). No build step
  with Node unless the specification phase decides on one.
- **Look:** the colours (light and dark, following the browser), the serif
  headings and the system fonts of the website, the site name instead of the
  Keycloak logo. The values come from one decided place, so the theme and
  the frontend do not drift apart.
- **Languages:** English and German, as the realm has them; the texts the
  theme adds are in both. Where the frontend knows the language of the
  visitor, the login redirect of the backend passes it on (`ui_locales`), so
  the login page appears in the same language as the website.
- **Realm:** the realm import sets `loginTheme` to `avarc`. A change of the
  import does not reach an existing realm (see `AGENTS.md`); apply it in the
  console there, or reset the realm on dev.
- **Accessibility:** contrast and focus as for the website
  ([SPEC-frontend.md](../spec/SPEC-frontend.md)).

## Acceptance

- The decisions are in `SPEC-auth.md` before or together with the code.
- Login, password change and error pages appear in the look of the website
  in the light and the dark appearance, in English and German, and work on a
  phone.
- The image is still built by `-Pwith-docker` and nothing in the theme is
  specific to an environment or secret.
- A Keycloak upgrade note in the spec lists what has to be checked if
  templates are overridden.
