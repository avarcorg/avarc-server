# Frontend

This repository includes a Next.js frontend under `avarc-frontend`.

## Basics
- Start dev server: `npm run dev` (from `avarc-frontend`)
- Build with Maven: `mvn -pl avarc-frontend -am verify`
- Security scan: `npm run audit` or the Maven `verify` phase

## Docs
- Next.js: https://nextjs.org/docs
- React: https://react.dev/learn
# Frontend Development Rules

## Overview
This module (`avarc-frontend`) is a Next.js application that serves as the user interface and API gateway for the AvArc application.

## Technology Stack
- **Framework**: Next.js 15.3.0
- **React**: 19.1.0
- **Styling**: Tailwind CSS 3.4.1
- **i18n**: next-i18next, i18next, react-i18next
- **HTTP Client**: Axios 1.9.0
- **JWT**: jwt-decode 4.0.0
- **Translation**: Crowdin CLI integration

## Project Structure
- **Pages**: Next.js pages router (`pages/` directory)
- **Components**: React components in `components/` directory
- **Hooks**: Custom React hooks in `hooks/` directory
- **Services**: API service layer in `services/` directory
- **Utils**: Utility functions in `utils/` directory
- **Config**: Next.js and i18n configuration files

## Design Decisions

### Styling Convention: Tailwind CSS
- Tailwind CSS utility classes are the standard for styling components
- Use `className` attributes with Tailwind classes for all component styles
- Do not use inline `style={{...}}` except for rare dynamic cases
- Do not embed large CSS blocks in JS files
- Separate `.css` files are only for global styles, Tailwind config, or special overrides
- A linter is set up to enforce this convention and will run as part of the build process

### Separation of Concerns
- CSS and JavaScript files should be kept separated as much as appropriate
- Use CSS (or CSS-in-JS) for styling, and keep logic in JS/TS files
- Avoid inline styles and mixing logic with presentation unless necessary for a specific use case

### Debugging Markers
- The `data-filename` attribute should be kept in JS files on the topmost element of each component
- This aids in debugging and tracing rendered components in the DOM
- These markers should be filtered out in production/release builds

## File Patterns

### Included Files
- `**/*.{js,jsx,ts,tsx}`
- `**/*.css`
- `**/*.scss`
- `**/*.json`
- `**/*.md`
- `**/*.mdx`

### Excluded Directories
- `node_modules/**`
- `.next/**`
- `node/**`
- `target/**`
- `build/**`

## Import Rules

### Next.js Imports
```javascript
import { Link } from 'next/link'
import { Image } from 'next/image'
import { Head } from 'next/head'
import { Script } from 'next/script'
import { useRouter } from 'next/router'
import { usePathname, useSearchParams } from 'next/navigation'
```

### React Imports
```javascript
import { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react'
```

## Naming Conventions

### Components
- File Pattern: `components/**/*.{js,jsx,ts,tsx}`, `pages/**/*.{js,jsx,ts,tsx}`
- Component Name: PascalCase
- File Name: PascalCase

### Pages
- File Pattern: `pages/**/*.{js,jsx,ts,tsx}`
- File Name: kebab-case

### API Routes
- File Pattern: `pages/api/**/*.{js,ts}`
- File Name: kebab-case

### Styles
- File Pattern:
  - `**/*.css`
  - `**/*.scss`
  - `**/*.module.css`
  - `**/*.module.scss`

## Internationalization
- Use next-i18next for server-side translations
- Use i18next for client-side translations
- Store translation files in `public/locales/`
- Use `serverSideTranslations` for page-level translations
- Use `useTranslation` hook for component-level translations
- Manage translations via Crowdin CLI

## API Request Flow
- Browser makes request to frontend (e.g., `/api/auth/login`)
- Frontend (Next.js) receives the request
- Frontend makes server-side axios call to backend using `NEXT_PUBLIC_API_HOST`
- Backend processes the request and returns response
- Frontend forwards the response back to the browser

## Security Architecture
- Backend is not directly accessible from the browser
- All API calls are proxied through the frontend
- CORS is handled server-side
- Sensitive headers and tokens are managed server-side
- Better control over request/response transformation

## Communication Patterns
- Frontend and Backend identify objects via UUID
- Set the UUID in the service classes, not in the mapper
- Use consistent data structures across frontend and backend

## Key Features
- Internationalization (i18n) with multiple languages
- Authentication flow (currently custom, will be adapted to Hydra/Kratos)
- Protected routes using `withAuth` HOC
- Navigation component with authentication state
- Dashboard component
- Translation management via Crowdin

## Current Authentication
- Uses JWT tokens (jwt-decode)
- Custom authentication flow
- Will be replaced with OAuth2/OIDC flow via Hydra

## Future Integration
- Replace custom auth with Hydra OAuth2/OIDC flow
- Integrate with Kratos for user identity management
- Implement consent flow for OAuth2
- Update token handling to use Hydra tokens

## Integration Points
- **Frontend ↔ Hydra**: OAuth2/OIDC authorization flow
- **Frontend ↔ Backend**: API calls with Hydra access tokens (proxied through frontend)
- **Frontend ↔ NGINX**: All requests routed through NGINX reverse proxy

