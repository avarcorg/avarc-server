# SPEC: Authentication and Authorization

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define how users are identified and what they are allowed to do.

## Requirements

- Authentication and authorization are provided by a self-hosted Ory stack.
- The application does not store passwords or implement its own login flow.
- The frontend initiates login/registration/logout flows through Ory.
- The backend authenticates every request that is not explicitly public
  by validating the identity or session issued via Ory.
- Authorization distinguishes at least viewing and editing locations; the
  concrete roles and permissions are defined here once decided.

## Open questions

- Which Ory components are used (identity, OAuth2/OIDC, permissions).
- Session or token based access from the frontend to the backend.
- Role model and how permissions are stored and evaluated.
- Hosting and operation of the Ory deployment.
