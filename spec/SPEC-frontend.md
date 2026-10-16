# SPEC: Frontend

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define the web user interface for browsing and managing locations.

## Requirements

- Implemented with Next.js and TypeScript.
- Displays locations, in particular on a map, with their descriptions.
- Provides forms to create and edit locations for authorized users.
- Provides the login and logout pages and shows the logged-in user; the
  login itself is done by the backend, as defined by
  [SPEC-auth.md](SPEC-auth.md).
- Talks to the backend only through its HTTP API.

## Decisions

- **Framework:** Next.js with TypeScript, using the App Router and
  server-side rendering. The server side is needed because pages ask the
  backend for the current user, forwarding the session cookie
  (`BACKEND_URL`, the backend's internal address), and redirect visitors
  without a session to `/login`; the frontend is therefore not a static
  export. The pages `/login` and `/logged-out` are public; everything else
  requires a session ([SPEC-auth.md](SPEC-auth.md)).
- **Map:** Leaflet through react-leaflet, with markers for `point`
  positions. Further position kinds ([SPEC-locations.md](SPEC-locations.md))
  are drawn as they are added.
- **Tiles:** the standard OpenStreetMap raster tiles
  (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`), with the required
  attribution shown on the map. They need no account or key, and their usage
  policy allows the light use of an internal tool; a hosted provider with a
  key (a secret of the environment, not committed) replaces them if the use
  outgrows that policy. The browser of the person using the map loads the
  tiles.
- **Styling:** Tailwind CSS.
- **Languages:** next-intl provides the translations and the language in the
  route; English and German first, further languages without code changes
  to the routing ([SPEC.md](../SPEC.md)).

## Build

Introduced in [AVARC-6](../tasks/finished/TASK-frontend-skeleton.md).

- **Module:** `avarc-server-frontend`, a module of the Maven build, which
  orchestrates installing the dependencies (`npm ci`) and `next build`
  (which also type-checks) in the `compile` lifecycle. The `package.json`
  pins exact versions and `package-lock.json` is committed. Dependencies that
  are only needed to build (Tailwind, PostCSS, the type definitions) belong in
  `devDependencies`: the image holds the traced `node_modules` of the
  standalone server, and the buildpack fails on a runtime dependency that
  is missing there.
- **No Node on the host:** every Node command runs in a container of the
  `node.image` Maven property, as the calling user, through
  `docker-node.sh`. The development server runs the same way. Node and npm
  are not required on the build server or the developer machine.
- **Image:** with the `with-docker` profile, Paketo buildpacks through the
  `pack` CLI package the standalone server that `next build` wrote (with its
  static files copied next to it) into
  `<image.namespace>/avarc-frontend:<version>` (and `latest`),
  listening on port 3000. The `pack` invocation and the `image.namespace`
  and `image.name` properties are shared with the other modules through the
  parent POM.
- **Scope so far:** the login, logged-out and home pages
  ([SPEC-auth.md](SPEC-auth.md)), styled with Tailwind CSS (v4, through
  PostCSS) in the layout below, in English and German with the language in
  the route (`/en/...`, `/de/...`; a path without a language goes to the
  language of the browser, the backend's redirects need no language); the
  map and the other decisions above are applied as the pages are built.

## Locations

Introduced in [AVARC-12](../tasks/finished/TASK-locations-ui.md), in two steps: the
read-only pages first, then the forms. All pages need a session and ask the
backend's `/api/locations` ([SPEC-locations.md](SPEC-locations.md)) on the
server, forwarding the session cookie.

- **Map and list page** (`/locations`, entry "Locations" in the navigation):
  a Leaflet map with a marker for every `point` position and the same
  locations as a list beside or, on a phone, below it. A marker opens a
  popup with the name and a link to the location; the list shows the name,
  the period label and the tags. The map is drawn in the browser (Leaflet needs it), the list on the
  server. All locations are loaded for the map, a page at a time of the
  maximum size; a bounding-box query of the API is the later answer when the
  number outgrows that.
- **Detail page** (`/locations/<id>`): name, description, period (label, and
  the bounds when given), confidence levels, tags, references (the url as a link
  that opens in a new tab, and the citation) and a small map with the
  position.
- **Language:** the texts of a location are shown in the language of the page.
  When there is none, the English one is used, else the one with the lowest
  language code, as in the language fallback of
  [SPEC-locations.md](SPEC-locations.md); the page then says that the text
  is not translated. The same rule picks a reference citation and a tag
  label, with the tag key as the final fallback.
- **Forms (second step):** `/locations/new` and `/locations/<id>/edit`, for
  `editor` and `admin`; everyone else is sent back to the locations. The
  controls ("New location", "Edit", and "Tags" for admins in the
  navigation) are shown only for those roles (the roles come from
  `GET /api/auth/me`; the backend enforces them). The form has the position,
  a text block per language (name, description, period label, confidence of
  the text; a language left empty is not sent, and at least one is needed),
  the confidence of the location, the period as years (the first day of the
  start year and the last day of the end year; negative before the common
  era), the tags and the references with a citation per language. The
  position is set by clicking on a map, with latitude and longitude fields
  that stay editable and in sync. Tags are chosen from the existing ones;
  new keys are typed, separated by commas. Saving, and deleting after a
  confirmation, are requests from the browser to `/api/locations` with the
  session cookie and the CSRF token that `GET /api/auth/me` reports; the
  answer of the backend (a rule that was broken, or `401` and `403`) is shown
  on the form.
- **Tag labels:** `/tags`, for admins only, lists the tags with the number of
  locations that carry them and saves the labels of a tag, per language, with
  `PUT /api/tags/{key}`.
- **Texts:** all fixed texts come from the translations, as above.

## Layout

Introduced in [AVARC-41](../tasks/finished/TASK-website-layout.md). One frame, a
single layout component of the App Router, carries every page; pages hold
no header or footer markup of their own.

- **Frame:** a top bar, the content, a footer. The top bar has the site
  name (a link home) on the left, then the navigation, and on the right the
  language switch and the user menu with the logout action. The footer is
  small and holds the tagline of the site.
- **Navigation:** one entry per page that exists, so the list grows with
  the pages (the locations list and the map, [AVARC-12](../tasks/finished/TASK-locations-ui.md)).
  Editing controls are shown by role ([SPEC-auth.md](SPEC-auth.md)).
- **Content width:** text and form pages sit in a centred column of limited
  width; a page may opt out and take the full width, which the map does.
  The public pages (`/login`, `/logged-out`) use the same frame without
  navigation and user menu.
- **Phone:** the same frame; the navigation collapses behind a menu button
  and opens as a dropdown below the top bar. The content uses the full
  width with a small side padding. Nothing scrolls horizontally.
- **Colours:** the warm stone neutrals with the amber accent of the current
  pages, light and dark following the browser. The colours are Tailwind
  theme values defined once in the stylesheet (`@theme`) and used by name,
  not repeated as literal shades in the pages.
- **Typography:** a serif face for headings, which gives the historical
  feel, and the system sans-serif font for text; both are system fonts, so
  nothing is loaded from a third party.
- **Developer links:** introduced in [AVARC-45](../tasks/finished/TASK-footer-dev-links.md).
  On dev and stage the footer also links to the tools that exist there: the
  web database tool, the Keycloak admin console, Swagger UI (`/api/docs`) and the JSON API document
  (`/api/docs/openapi.json`, [SPEC-backend.md](SPEC-backend.md)). The
  frontend learns about them at runtime, since the image is the same for
  every environment: `FOOTER_API_DOCS=true` shows the two API links
  (same-origin, served through the ingress) and a non-empty
  `FOOTER_DBTOOL_URL` and `FOOTER_KEYCLOAK_URL` show the database tool and
  Keycloak admin console links. `run.sh` sets them
  ([SPEC-deployment.md](SPEC-deployment.md)); unset or empty means no link,
  so prod has none. The links open in a new browser tab. Nothing is baked into the page bundle.
- **Texts:** every text of the frame comes from the translations
  (Languages above), none is written into the component.
- **Accessibility:** semantic landmarks (`header`, `nav`, `main`,
  `footer`), a "skip to content" link, visible keyboard focus, text
  contrast of at least WCAG AA in both appearances, and a navigation that
  works with the keyboard alone, the menu button included.

## Open questions

- Accessibility requirements.
