/**
 * Minimal fetch wrapper for the Aura Leaf API routes.
 *
 * Always reads fresh data from the database (no-store) and surfaces the
 * server's `error` message so pages can show a friendly failure state.
 */
export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { cache: "no-store", ...init });

  if (!response.ok) {
    let message = "Something went wrong while loading the menu.";
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "error" in body) {
        const { error } = body as { error?: unknown };
        if (typeof error === "string" && error.length > 0) message = error;
      }
    } catch {
      // Response body was not JSON — keep the generic message.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}
