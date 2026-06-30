import { env } from "../config/env.js";

export type PlatformIdentity = "grand-king" | "founder-tenant" | "admin";

/** UID-001 — Grand King is recognized at auth; not a selectable role. */
export function resolvePlatformIdentity(email: string, role: string): PlatformIdentity {
  if (email.toLowerCase() === env.FOUNDER_EMAIL.toLowerCase()) {
    return "grand-king";
  }
  if (role === "admin") {
    return "admin";
  }
  return "founder-tenant";
}

export function isGrandKingIdentity(identity: PlatformIdentity): boolean {
  return identity === "grand-king";
}
