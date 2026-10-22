const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

const ACCESS = "nextgen.access";
const REFRESH = "nextgen.refresh";

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export const tokens = {
  get access() {
    return read(ACCESS);
  },
  get refresh() {
    return read(REFRESH);
  },
  set(access: string, refresh?: string) {
    try {
      localStorage.setItem(ACCESS, access);
      if (refresh) localStorage.setItem(REFRESH, refresh);
    } catch {
      /* storage blocked: the session just won't survive a reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(ACCESS);
      localStorage.removeItem(REFRESH);
    } catch {
      /* ignore */
    }
  },
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(messageFrom(data) ?? `Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
}

/** Turn DRF's error shapes ({detail}, {field: [msg]}) into one readable line. */
function messageFrom(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  for (const value of Object.values(record)) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    if (typeof value === "string") return value;
  }
  return null;
}

let refreshing: Promise<boolean> | null = null;

/** Swap the refresh token for a new access token. Shared so parallel 401s refresh once. */
function refreshAccess(): Promise<boolean> {
  if (!tokens.refresh) return Promise.resolve(false);
  refreshing ??= fetch(`${API_URL}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: tokens.refresh }),
  })
    .then(async (res) => {
      if (!res.ok) return false;
      const data = await res.json();
      tokens.set(data.access);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export const SESSION_EXPIRED = "nextgen:session-expired";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
}

export async function api<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const { method = "GET", body, headers = {}, auth = true } = options;
  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";
  if (auth && tokens.access) finalHeaders.Authorization = `Bearer ${tokens.access}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, { detail: "Can't reach the server. Check your connection and try again." });
  }

  if (res.status === 401 && auth && !retried) {
    if (await refreshAccess()) return api<T>(path, options, true);
    tokens.clear();
    window.dispatchEvent(new Event(SESSION_EXPIRED));
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}
