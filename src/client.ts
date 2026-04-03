import type {
  SmallStackConfig,
  User,
  AuthTokens,
  ApiResponse,
  RegisterData,
  RequestOptions,
} from "./types.js";

export class SmallStackClient {
  private baseUrl: string;
  private token: string | undefined;

  /** Auth namespace with authentication-related methods. */
  public readonly auth: {
    login: (username: string, password: string) => Promise<ApiResponse<AuthTokens>>;
    logout: () => Promise<ApiResponse<void>>;
    me: () => Promise<ApiResponse<User>>;
    register: (data: RegisterData) => Promise<ApiResponse<User>>;
    refreshToken: () => Promise<ApiResponse<AuthTokens>>;
  };

  constructor(config: SmallStackConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.token = config.token;

    this.auth = {
      login: this.login.bind(this),
      logout: this.logout.bind(this),
      me: this.me.bind(this),
      register: this.register.bind(this),
      refreshToken: this.refreshToken.bind(this),
    };
  }

  /**
   * Set the auth token for subsequent requests.
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Clear the current auth token.
   */
  clearToken(): void {
    this.token = undefined;
  }

  /**
   * Make an authenticated API request.
   */
  async api<T = unknown>(
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { method = "GET", headers = {}, body, params } = options;

    let url = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    };

    if (this.token) {
      requestHeaders["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body != null ? JSON.stringify(body) : undefined,
    });

    const data = response.status === 204
      ? (undefined as T)
      : ((await response.json()) as T);

    return {
      data,
      status: response.status,
      ok: response.ok,
    };
  }

  // ---- Auth methods (bound to this.auth namespace) ----

  private async login(
    username: string,
    password: string,
  ): Promise<ApiResponse<AuthTokens>> {
    const result = await this.api<AuthTokens>("/api/auth/login/", {
      method: "POST",
      body: { username, password },
    });

    if (result.ok && result.data?.access) {
      this.token = result.data.access;
    }

    return result;
  }

  private async logout(): Promise<ApiResponse<void>> {
    const result = await this.api<void>("/api/auth/logout/", {
      method: "POST",
    });

    if (result.ok) {
      this.clearToken();
    }

    return result;
  }

  private async me(): Promise<ApiResponse<User>> {
    return this.api<User>("/api/auth/me/");
  }

  private async register(data: RegisterData): Promise<ApiResponse<User>> {
    return this.api<User>("/api/auth/register/", {
      method: "POST",
      body: data,
    });
  }

  private async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    const result = await this.api<AuthTokens>("/api/auth/token/refresh/", {
      method: "POST",
    });

    if (result.ok && result.data?.access) {
      this.token = result.data.access;
    }

    return result;
  }
}
