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
const { data: tokens } = await client.auth.login("admin", "password");

// Get current user
const { data: user } = await client.auth.me();
console.log(user.username, user.email);

// Make an API call
const { data } = await client.api("/api/items/", {
  method: "GET",
  params: { page: "1" },
});
```

## Authentication

SmallStack uses JWT token-based authentication. The SDK manages tokens automatically — after a successful `login()` or `refreshToken()`, the access token is stored and sent with all subsequent requests.

```typescript
// Login — token is stored automatically
await client.auth.login("admin", "password");

// All subsequent calls are authenticated
const { data: user } = await client.auth.me();

// Refresh when the access token expires
await client.auth.refreshToken();

// Logout — clears the stored token
await client.auth.logout();
```

### Pre-existing Token

If you already have a token (e.g. from a cookie or localStorage):

```typescript
const client = new SmallStackClient({
  baseUrl: "https://your-app.example.com",
  token: "eyJ...",
});

// Or set it later
client.setToken("eyJ...");
```

## API Reference

### `new SmallStackClient(config)`

| Option    | Type     | Required | Description                          |
|-----------|----------|----------|--------------------------------------|
| `baseUrl` | `string` | Yes      | Base URL of your SmallStack instance |
| `token`   | `string` | No       | Pre-existing JWT access token        |

### `client.auth`

| Method | Description |
|--------|-------------|
| `login(username, password)` | Authenticate and store the access token |
| `logout()` | Log out and clear the stored token |
| `me()` | Get the current authenticated user |
| `register(data)` | Register a new user account |
| `refreshToken()` | Refresh the access token using the refresh token |

### `client.api<T>(path, options?)`

Make an authenticated request to any SmallStack API endpoint. Returns `ApiResponse<T>`.

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
| `client.setToken(token)` | Manually set the auth token |
| `client.clearToken()` | Clear the stored auth token |

## Types

All TypeScript types are exported from the package:

```typescript
import type {
  SmallStackConfig,
  User,
  AuthTokens,
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
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: string;
}

interface AuthTokens {
  access: string;
  refresh: string;
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

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/token/` | POST | Obtain JWT token pair |
| `/api/auth/token/refresh/` | POST | Refresh access token |
| `/api/auth/register/` | POST | Register a new user |
| `/api/auth/me/` | GET | Get current user info |
| `/api/auth/password/` | POST | Change password |
| `/api/auth/logout/` | POST | Invalidate token |
| `/api/auth/users/` | GET | List users (staff only) |
| `/api/auth/users/:id/` | GET/PUT | User detail (staff only) |
| `/api/schema/openapi.json` | GET | OpenAPI schema |

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
