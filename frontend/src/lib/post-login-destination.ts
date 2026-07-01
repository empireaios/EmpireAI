import type { AuthUser } from "@/api/auth";
import { paths } from "@/routes/paths";

/** UX-001 — role-correct landing after authentication. */
export function postLoginDestination(user: AuthUser): string {
  if (user.role === "operator") {
    return paths.dashboard.brands;
  }
  return paths.dashboard.home;
}

/** Whether the user is a Grand King / founder persona (GC-02 · GC-06 apply). */
export function isFounderPersona(role: AuthUser["role"]): boolean {
  return role === "founder" || role === "admin";
}
