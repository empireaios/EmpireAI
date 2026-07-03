import type { SessionUser } from "@/lib/auth/types";

export function resolveExecutiveDisplayName(user: SessionUser | null | undefined): string {
  if (user?.platformIdentity === "grand-king") {
    return "Grand King";
  }
  return user?.name?.split(" ")[0] ?? "Executive";
}

export function resolvePlatformIdentityLabel(user: SessionUser | null | undefined): string {
  if (user?.platformIdentity === "grand-king") {
    return "Grand King";
  }
  if (user?.platformIdentity === "admin") {
    return "Platform Admin";
  }
  return user?.role ?? "Session";
}
