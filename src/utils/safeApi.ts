/**
 * Safe API response parser and fetch wrapper.
 * Prevents "Unexpected end of JSON input" and "unexpected document type" (HTML/DOCTYPE) parse errors.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

/**
 * Safely parses a fetch Response object without throwing unhandled syntax errors.
 * Inspects HTTP status, Content-Type, empty bodies, and HTML/DOCTYPE fallbacks.
 */
export async function safeParseJson<T = any>(res: Response): Promise<ApiResponse<T>> {
  const status = res.status;
  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  // 1. Handle HTTP statuses with no content
  if (status === 204 || status === 205 || status === 304) {
    return {
      ok: res.ok,
      status,
      data: null,
      error: res.ok ? null : `Server returned HTTP ${status} without a response body.`,
    };
  }

  // 2. Read raw response text safely
  let text = '';
  try {
    text = await res.text();
  } catch (readErr: any) {
    return {
      ok: false,
      status,
      data: null,
      error: `Failed to read server response: ${readErr?.message || 'Network stream error'}`,
    };
  }

  // 3. Handle empty response body
  if (!text || !text.trim()) {
    if (res.ok) {
      return { ok: true, status, data: null, error: null };
    }
    return {
      ok: false,
      status,
      data: null,
      error: `Server returned an empty response with status ${status}.`,
    };
  }

  const trimmed = text.trim();

  // 4. Handle HTML responses or unexpected document types (e.g. <!DOCTYPE html>, SPA fallback, 404/500 pages)
  if (
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html') ||
    contentType.includes('text/html')
  ) {
    let message = `Server returned an HTML document (${status}) instead of JSON.`;
    if (status === 401 || status === 403) {
      message = 'Authentication required or session expired. Please sign in again.';
    } else if (status === 404) {
      message = 'API endpoint not found (404). Please verify server route configuration.';
    } else if (status >= 500) {
      message = `Server error (${status}). Please try again in a few moments.`;
    }
    return {
      ok: false,
      status,
      data: null,
      error: message,
    };
  }

  // 5. Safely parse JSON
  try {
    const json = JSON.parse(trimmed) as T;
    if (!res.ok) {
      const errPayload = (json as any)?.error || (json as any)?.message;
      const cleanError = typeof errPayload === 'string'
        ? errPayload
        : (json as any)?.errors
          ? JSON.stringify((json as any).errors)
          : `Request failed with status ${status}`;
      return {
        ok: false,
        status,
        data: json,
        error: cleanError,
      };
    }
    return {
      ok: true,
      status,
      data: json,
      error: null,
    };
  } catch (parseErr: any) {
    return {
      ok: false,
      status,
      data: null,
      error: `Invalid JSON received from server (${status}): ${parseErr?.message || 'Syntax error'}`,
    };
  }
}

/**
 * Convenience wrapper for fetch with automatic safe JSON parsing.
 */
export async function safeFetchJson<T = any>(input: RequestInfo | URL, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(input, init);
    return await safeParseJson<T>(res);
  } catch (networkErr: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: networkErr?.message || 'Network connection failed. Please check your internet connection.',
    };
  }
}
