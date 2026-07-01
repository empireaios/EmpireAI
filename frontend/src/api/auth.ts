import { apiRequest } from "@/api/client";

export type UserRole = "founder" | "admin" | "operator";
export type PlatformIdentity = "grand-king" | "founder-tenant" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId: string;
  platformIdentity?: PlatformIdentity;
}

export async function login(email: string, password: string) {
  return apiRequest<{ user: AuthUser; expiresAt: string }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function logout() {
  return apiRequest<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

export async function getMe() {
  return apiRequest<{ user: AuthUser }>("/auth/me");
}
