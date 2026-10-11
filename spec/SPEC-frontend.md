# SPEC: Frontend

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define the web user interface for browsing and managing locations.

## Requirements

- Implemented with Next.js.
- Displays locations, in particular on a map, with their descriptions.
- Provides forms to create and edit locations for authorized users.
- Handles login and logout through Ory as defined by
  [SPEC-auth.md](SPEC-auth.md).
- Talks to the backend only through its HTTP API.

## Open questions

- Map library and tile provider.
- Rendering strategy and styling approach.
- Languages and accessibility requirements.
