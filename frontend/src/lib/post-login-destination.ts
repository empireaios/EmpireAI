import type { AuthUser } from "@/api/auth";
import { buildCockpitRedirectUrl } from "@/lib/cockpit-redirects";

/** UX-001 / REAL-126 — post-auth landing on Cockpit canonical routes. */
export function postLoginDestination(user: AuthUser): string {
  if (user.role === "operator") {
    return buildCockpitRedirectUrl("/dashboard/brands");
  }
  return buildCockpitRedirectUrl("/dashboard");
}

/** Whether the user is a Grand King / founder persona (GC-02 · GC-06 apply). */
export function isFounderPersona(role: AuthUser["role"]): boolean {
  return role === "founder" || role === "admin";
}
