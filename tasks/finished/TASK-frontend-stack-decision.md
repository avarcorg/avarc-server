---
id: AVARC-7
type: decision
status: finished
priority: normal
area: frontend
created: 2026-10-11
---

# TASK: Frontend technology decisions

Spec: [SPEC-frontend.md](../../spec/SPEC-frontend.md)

- Choose the map library and tile provider.
- Choose the styling approach and Next.js rendering strategy.
- Update `spec/SPEC-frontend.md` with the decisions.

Decided: Next.js with TypeScript, App Router and server-side rendering;
Leaflet through react-leaflet with hosted raster tiles; Tailwind CSS;
next-intl. Recorded in [SPEC-frontend.md](../../spec/SPEC-frontend.md).
