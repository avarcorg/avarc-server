---
id: AVARC-46
type: task
status: finished
priority: normal
area: frontend
created: 2026-10-15
---

# TASK: Externalize fixed UI strings

Spec: [SPEC-frontend.md](../../spec/SPEC-frontend.md)

All fixed texts of the user interface (labels, buttons, messages, page
titles, the texts of errors shown to users) come from the translation files
and none is written into a component or page, so that they can be
translated and maintained in one place.

## Result

The interface already took most texts from next-intl. An audit of the
components, pages and libraries found the rest: the word "contributors" in the
map attribution (two maps), the backend's English `detail` shown in forms, and
the missing error and not-found pages (the Next defaults are English). Those
are translated now (`Map`, `Errors` and `rejected` keys), and the product names
(OpenStreetMap, Keycloak, Swagger UI) are keys (`Products`), and
`tools/check-messages.py` fails the build when the language files differ in
keys, placeholders or empty texts. Rule: [SPEC-frontend.md](../../spec/SPEC-frontend.md),
"Fixed texts". Not covered: an unsupported language code in the path that reaches the
layout falls back to Next's own English 404 page, as the layout that provides
the texts does not exist there (not checked how often the proxy lets one
through).

## Acceptance

- No fixed text is written into a component or page: checked by reading all
  of `src`; the frontend build passes.
- A missing key, an empty text or a different placeholder in one language
  fails `tools/check-messages.py` (tried with a copy of the files).
