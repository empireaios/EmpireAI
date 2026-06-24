export type UserRole = "founder" | "operator" | "admin";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId: string;
};

export type AuthState = {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
};
