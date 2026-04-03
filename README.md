# smallstack-sdk-js

JavaScript/TypeScript SDK for the [SmallStack](https://github.com/emichaud/django-smallstack) Django framework.

Zero runtime dependencies. Works in Node.js, Deno, Bun, and modern browsers (native `fetch`).

## Install

```bash
npm install smallstack-sdk-js
```

## Quick Start

```typescript
import { SmallStackClient } from "smallstack-sdk-js";

const client = new SmallStackClient({
  baseUrl: "https://your-app.example.com",
});

// Authenticate
const { data } = await client.auth.login("admin", "password");
console.log(data.token);       // Bearer token (store securely)
console.log(data.expires_at);  // Token expiry timestamp

// Get current user
const { data: user } = await client.auth.me();
console.log(user.username, user.email);

// Make an API call
const { data: items } = await client.api("/api/items/");
```

## Authentication

SmallStack uses Bearer token authentication. Tokens are opaque strings (not JWT) generated server-side and validated against a SHA-256 hash in the database. Each user has one login token at a time — logging in again replaces the previous token.

The SDK manages tokens automatically: after a successful `login()`, `register()`, or `refreshToken()`, the token is stored and sent as an `Authorization: Bearer <token>` header with all subsequent requests.

```typescript
// Login — token is stored automatically
const { data } = await client.auth.login("admin", "password");
// data.token, data.user, data.expires_at

// All subsequent calls are authenticated
const { data: user } = await client.auth.me();

// Refresh before the token expires (generates a new token, old one stops working)
await client.auth.refreshToken();

// Optionally request a longer expiry (in hours, up to server max)
await client.auth.refreshToken(48);

// Logout — revokes the token server-side and clears it locally
await client.auth.logout();
```

### Pre-existing Token

If you already have a token (e.g. from a cookie or secure storage):

```typescript
const client = new SmallStackClient({
  baseUrl: "https://your-app.example.com",
  token: "your-bearer-token",
});

// Or set it later
client.setToken("your-bearer-token");
```

## API Reference

### `new SmallStackClient(config)`

| Option    | Type     | Required | Description                          |
|-----------|----------|----------|--------------------------------------|
| `baseUrl` | `string` | Yes      | Base URL of your SmallStack instance |
| `token`   | `string` | No       | Pre-existing Bearer token            |

### `client.auth`

| Method | Description |
|--------|-------------|
| `login(username, password)` | Authenticate and store the token |
| `logout()` | Revoke the token server-side and clear it locally |
| `me()` | Get the current authenticated user |
| `register(data)` | Register a new user (requires auth-level token) |
| `refreshToken(expiresHours?)` | Generate a new token (old one stops working) |
| `changePassword(current, new)` | Change the authenticated user's password |

All auth methods return `ApiResponse<T>`:

```typescript
// login, register, refreshToken return:
{ data: { token: string, user: User, expires_at: string }, status: number, ok: boolean }

// me returns:
{ data: { id, username, email, is_staff }, status: number, ok: boolean }

// logout, changePassword return:
{ data: { message: string }, status: number, ok: boolean }
```

### `client.api<T>(path, options?)`

Make an authenticated request to any SmallStack API endpoint.

```typescript
const { data, status, ok } = await client.api<Item[]>("/api/items/");
```

| Option    | Type     | Default | Description              |
|-----------|----------|---------|--------------------------|
| `method`  | `string` | `"GET"` | HTTP method              |
| `headers` | `object` | `{}`    | Additional request headers |
| `body`    | `unknown`| —       | Request body (auto-serialized as JSON) |
| `params`  | `object` | —       | URL query parameters     |

### Token Management

| Method | Description |
|--------|-------------|
| `client.setToken(token)` | Manually set the Bearer token |
| `client.clearToken()` | Clear the stored token |

## Types

All TypeScript types are exported from the package:

```typescript
import type {
  SmallStackConfig,
  User,
  TokenResponse,
  ApiResponse,
  PaginatedResponse,
  RegisterData,
  RequestOptions,
} from "smallstack-sdk-js";
```

### Key Types

```typescript
interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
}

interface TokenResponse {
  token: string;
  user: User;
  expires_at: string;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
```

## SmallStack API Endpoints

The SDK is built to work with these SmallStack API endpoints:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/token/` | POST | None (credentials) | Login — returns Bearer token |
| `/api/auth/token/refresh/` | POST | Bearer | Refresh token (new token, old one revoked) |
| `/api/auth/logout/` | POST | Bearer | Revoke token |
| `/api/auth/me/` | GET | Bearer | Get current user |
| `/api/auth/password/` | POST | Bearer | Change own password |
| `/api/auth/password-requirements/` | GET | None | List password validation rules |
| `/api/auth/register/` | POST | Auth-level | Register a new user |
| `/api/auth/users/` | GET | Auth-level | List/search users |
| `/api/auth/users/:id/` | GET/PATCH | Auth-level | User detail/update |
| `/api/auth/users/:id/password/` | POST | Auth-level | Set user's password |
| `/api/auth/users/:id/deactivate/` | POST | Auth-level | Deactivate user |
| `/api/schema/openapi.json` | GET | None | OpenAPI schema |

**Token types:** Login tokens (from `/api/auth/token/`) use the caller's permissions. Manual tokens (created via admin UI) can have access levels: `auth` (full), `staff` (CRUD only), or `readonly` (GET only).

Any additional API endpoints registered via SmallStack's `@api_view` decorator or `CRUDView` are accessible through `client.api()`.

## Working with CRUD Endpoints

SmallStack's `CRUDView` auto-generates REST endpoints. Use `client.api()` with the `PaginatedResponse` type:

```typescript
interface Task {
  id: number;
  title: string;
  completed: boolean;
}

// List (paginated)
const { data } = await client.api<PaginatedResponse<Task>>("/api/tasks/");
console.log(data.results, data.count);

// Create
await client.api<Task>("/api/tasks/", {
  method: "POST",
  body: { title: "New task", completed: false },
});

// Update
await client.api<Task>("/api/tasks/1/", {
  method: "PATCH",
  body: { completed: true },
});

// Delete
await client.api("/api/tasks/1/", { method: "DELETE" });
```

## Error Handling

The SDK doesn't throw on non-2xx responses. Check `ok` and `status` on the response:

```typescript
const result = await client.auth.login("admin", "wrong-password");

if (!result.ok) {
  console.error(`Login failed (${result.status})`, result.data);
}
```

## Development

```bash
npm install         # Install dependencies
npm run build       # Build (CJS + ESM + .d.ts)
npm run dev         # Build in watch mode
npm run lint        # Type-check with tsc
npm run clean       # Remove dist/
```

## License

MIT
