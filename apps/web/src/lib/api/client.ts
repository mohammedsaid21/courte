export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
  }
}

function rawMessage(details: unknown, status: number) {
  if (typeof details === "object" && details && "message" in details) {
    const value = (details as { message: unknown }).message;
    if (Array.isArray(value)) return value.map(String).join(". ");
    if (typeof value === "string" && value.trim()) return value;
  }
  return `Request failed (${status})`;
}

export function userFacingMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Please sign in to continue.";
    if (error.status === 404) {
      if (/venue/i.test(error.message)) return "This venue could not be found.";
      if (/resource/i.test(error.message)) return "This court or field is not available.";
      if (/booking/i.test(error.message)) return "This booking could not be found.";
      return "We could not find what you were looking for.";
    }
    if (error.status === 409 || /no longer available|already booked/i.test(error.message)) {
      return "This time slot is no longer available.";
    }
    if (error.status === 403) return error.message || "You cannot do that right now.";
    if (error.status === 400) return error.message || "Please check the details and try again.";
    if (!/internal|prisma|sql|exception|stack/i.test(error.message)) return error.message;
  }
  if (error instanceof Error && !/internal|prisma|sql|exception|stack/i.test(error.message)) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { createClient } = await import("../supabase/client");
  let accessToken: string | undefined;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    accessToken = data.session?.access_token;
  } catch {
    accessToken = undefined;
  }

  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
  const response = await fetch(`${base}${path}`, { ...init, headers });
  if (!response.ok) {
    let details: unknown = null;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    throw new ApiError(rawMessage(details, response.status), response.status, details);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function publicApi<T>(path: string, init: RequestInit & { next?: { revalidate?: number } } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers,
    next: init.next,
  });
  if (!response.ok) {
    let details: unknown = null;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    throw new ApiError(rawMessage(details, response.status), response.status, details);
  }
  return response.json() as Promise<T>;
}
