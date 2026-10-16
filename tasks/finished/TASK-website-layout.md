---
id: AVARC-41
type: task
status: finished
priority: normal
area: frontend
depends-on: [AVARC-6]
created: 2026-10-15
---

# TASK: A nicer layout for the website

Spec: [SPEC-frontend.md](../../spec/SPEC-frontend.md)

The frontend so far has the plain pages of the skeleton: login, logged out
and a home page, styled with Tailwind CSS
([AVARC-6](TASK-frontend-skeleton.md)). The website needs a
layout that looks cared for and that the later pages, the locations list
and map ([AVARC-12](TASK-locations-ui.md)), can sit in without a redesign.

## Specification phase

The look is settled before it is built, in the frontend spec.

- The person who owns the task may hand in screenshots, mockups or
  examples of sites they like during this phase; they are used as input
  for the spec, and are not committed to the repository unless the spec
  needs one to describe a decision.
- The implementation may also propose a layout of its own, with a short
  description of each alternative (or a rough sketch), for the owner to
  choose from. Nothing is built before the choice is written into the spec.
- The spec records the decided layout in words: the page frame (header,
  navigation, content width, footer), where the logged-in user and the
  language switch go, the colors and typography within Tailwind, and how
  the layout behaves on a phone.

## Suggested implementation

- **Shared frame:** one layout component in the App Router layout, used by
  all pages, instead of per-page markup. It carries the header with the
  site name, the navigation, the logged-in user with the logout action, and
  the footer.
- **Responsive:** usable from a phone to a wide desktop screen; the content
  area is designed so the map can later take the full width.
- **Appearance:** keeps the light and dark appearance that follows the
  browser; colors and spacing come from Tailwind theme values in one place,
  not from values repeated across pages.
- **Restyle the existing pages:** login, logged out and home use the new
  frame and look; no new functions are added.
- **Languages:** all texts of the frame come from the translations, so the
  frame works in every language ([SPEC.md](../../SPEC.md)).
- **Basic accessibility:** semantic landmarks, visible focus, sufficient
  contrast in both appearances, keyboard-operable navigation.

## Acceptance

- The decided layout is described in `SPEC-frontend.md` before any code
  changes.
- All existing pages use the shared frame and look the same on a phone, a
  tablet and a desktop screen, in the light and the dark appearance.
- `./mvnw -pl avarc-server-frontend verify` passes.
