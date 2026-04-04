/** Configuration for the SmallStack client. */
export interface SmallStackConfig {
  /** Base URL of the SmallStack API (e.g. "https://example.com"). */
  baseUrl: string;
  /** Optional Bearer token for authentication. */
  token?: string;
  /** Auth-level token used automatically for register(). */
  systemToken?: string;
  /** Auto-sync token to localStorage (browser only). Default: false. */
  persist?: boolean;
  /** localStorage key for persisted token. Default: "smallstack_token". */
  storageKey?: string;
}

/** Represents an authenticated user. */
export interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
}

/** Token response returned by login, register, and refresh endpoints. */
export interface TokenResponse {
  token: string;
  user: User;
  expires_at: string;
}

/** Standard API response wrapper. */
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

/** Paginated list response from SmallStack CRUD endpoints. */
export interface PaginatedResponse<T = unknown> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Registration payload. */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

/** Options for generic API requests. */
export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
}
