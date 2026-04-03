# CLAUDE.md

## Project Overview

This is **smallstack-sdk-js**, the official JavaScript/TypeScript SDK for the SmallStack Django framework. It provides a typed client for consuming the SmallStack API (authentication, CRUD, and custom endpoints).

## Common Commands

```bash
npm run build       # Build with tsup (CJS + ESM + .d.ts)
npm run dev         # Build in watch mode
npm run lint        # Type-check with tsc --noEmit
npm test            # Run tests
npm run clean       # Remove dist/
```

## Architecture

- `src/index.ts` — Public exports (re-exports client + types)
- `src/client.ts` — `SmallStackClient` class with auth namespace and generic `api()` method
- `src/types.ts` — TypeScript interfaces for config, user, tokens, API responses

### Build

Uses **tsup** to produce CJS (`dist/index.cjs`), ESM (`dist/index.js`), and declaration files (`dist/index.d.ts`). No runtime dependencies; uses native `fetch`.

### Conventions

- All API paths should start with `/` (e.g. `/api/auth/login/`)
- The client automatically manages the auth token after login/refresh
- Methods return `ApiResponse<T>` with `{ data, status, ok }`
