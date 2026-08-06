import type { ApiErrorView } from "@/components/shared/types/generationJob";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: string[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const BASE_PATH = "/api";

/**
 * Centralized `fetch` wrapper for all backend calls (targets AC-11/FR-12 —
 * frontend API access is centralized here, not scattered across components).
 * Normalizes non-2xx responses into a thrown `ApiError` with the server's
 * `{ code, message }` shape.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_PATH}${path}`, init);

  if (!response.ok) {
    let body: Partial<ApiErrorView> = {};
    try {
      body = (await response.json()) as ApiErrorView;
    } catch {
      // Response had no JSON body (e.g. a network-level failure); fall through
      // to the generic error below.
    }
    throw new ApiError(
      body.code ?? "INTERNAL_ERROR",
      body.message ?? `Request to ${path} failed with status ${response.status}.`,
      body.details,
    );
  }

  return (await response.json()) as T;
}
