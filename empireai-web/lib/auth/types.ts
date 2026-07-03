export type UserRole = "founder" | "operator" | "admin";

/** UID-001 — resolved at login; Grand King is not a selectable role. */
export type PlatformIdentity = "grand-king" | "founder-tenant" | "admin";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId: string;
  platformIdentity?: PlatformIdentity;
};

export type AuthState = {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
};
