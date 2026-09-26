import { createClient } from "./supabase/client";
import { ApiError } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

async function accessToken() {
  const { data } = await createClient().auth.getSession();
  return data.session?.access_token;
}

export async function uploadVenuePhoto(venueId: string, file: File) {
  const token = await accessToken();
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_URL}/venues/${venueId}/photos`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!response.ok) {
    let details: unknown = null;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    const message =
      typeof details === "object" &&
      details &&
      "message" in details &&
      typeof (details as { message: unknown }).message === "string"
        ? (details as { message: string }).message
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, details);
  }
  return response.json() as Promise<{ publicUrl: string }>;
}
