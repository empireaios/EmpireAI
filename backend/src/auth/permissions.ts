export type UserRole = "founder" | "operator" | "admin";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId: string;
};

export type SessionRecord = SessionUser & {
  token: string;
  expiresAt: string;
  createdAt: string;
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
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

export function canAccessModule(role: UserRole, module: string): boolean {
  return ROLE_PERMISSIONS[role].includes(module);
}
