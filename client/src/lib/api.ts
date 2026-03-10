import { useAuthStore } from "@/store/authStore";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();

  if (!refreshToken) {
    logout();
    return false;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${refreshToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      logout();
      return false;
    }

    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    logout();
    return false;
  }
}

function handleRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = refreshAccessToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, skipAuth = false, headers: customHeaders, ...rest } = options;

  const buildHeaders = (): HeadersInit => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      ...((customHeaders as Record<string, string>) || {}),
    };

    if (!skipAuth) {
      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        h["Authorization"] = `Bearer ${accessToken}`;
      }
    }

    return h;
  };

  const doFetch = async (): Promise<Response> => {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...rest,
      headers: buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  let response = await doFetch();

  if (response.status === 401 && !skipAuth) {
    const refreshed = await handleRefresh();
    if (refreshed) {
      response = await doFetch();
    } else {
      throw new ApiError(401, "Sesion expirada. Inicia sesion de nuevo.");
    }
  }

  if (!response.ok) {
    let message = "Error inesperado";
    let details: string | undefined;

    try {
      const errorBody = await response.json();
      message = Array.isArray(errorBody.message)
        ? errorBody.message.join(", ")
        : errorBody.message || message;
      details = errorBody.details;
    } catch {
      message = response.statusText || message;
    }

    throw new ApiError(response.status, message, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiFetchBlob(
  endpoint: string,
  options: RequestOptions = {}
): Promise<Blob> {
  const { body, skipAuth = false, headers: customHeaders, ...rest } = options;

  const buildHeaders = (): HeadersInit => {
    const h: Record<string, string> = {
      ...((customHeaders as Record<string, string>) || {}),
    };

    if (!skipAuth) {
      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        h["Authorization"] = `Bearer ${accessToken}`;
      }
    }

    return h;
  };

  const doFetch = async (): Promise<Response> => {
    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...rest,
      headers: buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  let response = await doFetch();

  if (response.status === 401 && !skipAuth) {
    const refreshed = await handleRefresh();
    if (refreshed) {
      response = await doFetch();
    } else {
      throw new ApiError(401, "Sesion expirada. Inicia sesion de nuevo.");
    }
  }

  if (!response.ok) {
    let message = "Error al descargar archivo";
    try {
      const errorBody = await response.json();
      message = errorBody.message || message;
    } catch {
      message = response.statusText || message;
    }
    throw new ApiError(response.status, message);
  }

  return response.blob();
}

export function apiGet<T>(endpoint: string, options?: RequestOptions) {
  return apiRequest<T>(endpoint, { ...options, method: "GET" });
}

export function apiPost<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
) {
  return apiRequest<T>(endpoint, { ...options, method: "POST", body });
}

export function apiPut<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
) {
  return apiRequest<T>(endpoint, { ...options, method: "PUT", body });
}

export function apiPatch<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
) {
  return apiRequest<T>(endpoint, { ...options, method: "PATCH", body });
}

export function apiDelete<T>(endpoint: string, options?: RequestOptions) {
  return apiRequest<T>(endpoint, { ...options, method: "DELETE" });
}
