# SPEC: Frontend

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define the web user interface for browsing and managing locations.

## Requirements

- Implemented with Next.js and TypeScript.
- Displays locations, in particular on a map, with their descriptions.
- Provides forms to create and edit locations for authorized users.
- Handles login and logout as the OIDC client of Keycloak, as defined by
  [SPEC-auth.md](SPEC-auth.md).
- Talks to the backend only through its HTTP API.

## Decisions

- **Framework:** Next.js with TypeScript, using the App Router and
  server-side rendering. The server side is needed because it is the OIDC
  client and holds the session ([SPEC-auth.md](SPEC-auth.md)); the frontend
  is therefore not a static export.
- **Map:** Leaflet through react-leaflet, with markers for `point`
  positions. Further position kinds ([SPEC-locations.md](SPEC-locations.md))
  are drawn as they are added.
- **Tiles:** raster tiles from a hosted provider with a free tier. The
  provider's API key is a secret of the environment, not committed, and the
  required attribution is shown on the map. The concrete provider is chosen
  with the map implementation.
- **Styling:** Tailwind CSS.
- **Languages:** next-intl provides the translations and the language in the
  route; English and German first, further languages without code changes
  to the routing ([SPEC.md](../SPEC.md)).

## Open questions

- The concrete tile provider.
- Accessibility requirements.
