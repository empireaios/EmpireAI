import type { AuthUser, PlatformIdentity, UserRole } from "@/api/auth";

/** UID-001 / contract — canonical role labels (never use retired synonyms). */
export function canonicalRoleLabel(role: UserRole, platformIdentity?: PlatformIdentity): string {
  if (platformIdentity === "grand-king") return "Grand King";
  if (role === "founder") return "Founder";
  if (role === "admin") return "Admin";
  if (role === "operator") return "Operator";
  return role;
}

export function canonicalPlatformIdentityLabel(identity?: PlatformIdentity): string {
  switch (identity) {
    case "grand-king":
      return "Grand King (Platform Owner)";
    case "founder-tenant":
      return "Founder (Tenant)";
    case "admin":
      return "Admin";
    default:
      return "—";
  }
}

export function resolveDisplayName(user: AuthUser, savedDisplayName?: string): string {
  return savedDisplayName?.trim() || user.name;
}
