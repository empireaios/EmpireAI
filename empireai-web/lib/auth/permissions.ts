import type { ModuleId } from "@/lib/platform/types";
import type { UserRole } from "./types";

export const ROLE_PERMISSIONS: Record<UserRole, ModuleId[]> = {
  founder: [
    "dashboard",
    "ai-ceo",
    "intelligence",
    "suppliers",
    "store",
    "marketing",
    "ads",
    "finance",
    "orders",
    "support",
    "settings",
  ],
  operator: [
    "dashboard",
    "intelligence",
    "suppliers",
    "store",
    "marketing",
    "ads",
    "finance",
    "orders",
    "support",
    "settings",
  ],
  admin: [
    "dashboard",
    "ai-ceo",
    "intelligence",
    "suppliers",
    "store",
    "marketing",
    "ads",
    "finance",
    "orders",
    "support",
    "settings",
    "admin",
  ],
};

export function canAccessModule(role: UserRole, module: ModuleId): boolean {
  return ROLE_PERMISSIONS[role].includes(module);
}
