# smallstack-sdk-js

JavaScript/TypeScript SDK for the [SmallStack](https://github.com/emichaud/django-smallstack) Django framework.

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

// Login
const { data: tokens } = await client.auth.login("admin", "password");

// Get current user
const { data: user } = await client.auth.me();
console.log(user.username);

// Generic API call
const { data } = await client.api("/api/items/", {
  method: "GET",
  params: { page: "1" },
});
```

## API

### `new SmallStackClient(config)`

| Option    | Type     | Required | Description                  |
|-----------|----------|----------|------------------------------|
| `baseUrl` | `string` | Yes      | Base URL of your SmallStack instance |
| `token`   | `string` | No       | Pre-existing auth token      |

### `client.auth`

- `login(username, password)` - Authenticate and store the access token
- `logout()` - Log out and clear the stored token
- `me()` - Get the current authenticated user
- `register(data)` - Register a new user
- `refreshToken()` - Refresh the access token

### `client.api(path, options?)`

Make an authenticated request to any API endpoint. Options:

- `method` - HTTP method (default: `"GET"`)
- `headers` - Additional headers
- `body` - Request body (serialized as JSON)
- `params` - URL query parameters

### `client.setToken(token)` / `client.clearToken()`

Manually manage the auth token.

## License

MIT
