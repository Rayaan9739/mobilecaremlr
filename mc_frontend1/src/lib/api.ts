// allow TS to compile when ImportMeta isn't typed in some setups
// augment the global ImportMeta interface
declare global {
  interface ImportMeta {
    env: Record<string, any>;
  }
}

const API_BASE =
  import.meta.env.VITE_API_BASE?.toString() || "http://localhost:5000/api";

interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

interface ApiError extends Error {
  error?: string;
}

const last5xxLogByUrl = new Map<string, number>();
const LOG_THROTTLE_MS = 30_000;

const api = async <T = unknown>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T | null> => {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  // Build URL with query params if provided
  let url = `${API_BASE}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError & { details?: unknown; code?: unknown } =
        await response.json().catch(() => ({ error: "Network error" }));

      // Console-only diagnostics (no UI changes)
      if (response.status >= 500) {
        const now = Date.now();
        const lastLoggedAt = last5xxLogByUrl.get(url) || 0;
        if (now - lastLoggedAt > LOG_THROTTLE_MS) {
          console.error("API 5xx response:", {
            url,
            status: response.status,
            error: error.error,
            details: error.details,
            code: error.code,
          });
          last5xxLogByUrl.set(url, now);
        }
      }

      // Handle only required HTTP status codes
      if (response.status === 400) {
        throw new Error(error.error || "Invalid request data");
      }

      if (response.status === 401) {
        localStorage.removeItem("token");
        // Don't throw for 401 - caller can handle silently if needed
        throw new Error("Unauthorized");
      }

      if (response.status === 403) {
        // Don't throw for 403 - caller can handle silently if needed (admin-only endpoints)
        throw new Error("Forbidden");
      }

      // Silently handle 404 and 429 errors
      if (response.status === 404 || response.status === 429) {
        throw new Error("Resource not found or rate limited");
      }

      if (response.status >= 500) {
        throw new Error(error.error || "Server error. Please try again later.");
      }

      throw new Error(error.error || "Request failed");
    }

    // Check if response is empty
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    // Silently handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("Network error");
    }
    // Re-throw other errors
    throw error;
  }
};

export default api;
