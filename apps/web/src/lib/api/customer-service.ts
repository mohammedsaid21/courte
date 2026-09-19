import { api } from "./client";
import type { Me } from "./types";

export const customerService = {
  me: () => api<Me>("/auth/me"),
  updateProfile: (body: { fullName: string; phone?: string | null; whatsapp?: string | null }) =>
    api<Me>("/auth/me", { method: "PATCH", body: JSON.stringify(body) }),
};
