# SPEC: Ingress web server

Status: draft. Part of [SPEC.md](../SPEC.md).

## Purpose

Define the web server that sits in front of the partial applications.

## Requirements

- Clients reach the frontend, the backend API and the Ory endpoints only
  through this web server.
- It routes requests to the right partial application.
- It terminates TLS.
- Its interplay with authentication (for example whether it enforces
  sessions or only forwards requests) is defined together with
  [SPEC-auth.md](SPEC-auth.md).

## Open questions

- Which web server product.
- URL layout: one host with path prefixes, or separate hosts per
  application.
- Whether it enforces authentication or leaves that to the applications.
- Caching, compression and rate limiting.
