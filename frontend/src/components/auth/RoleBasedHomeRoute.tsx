import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { isFounderPersona, postLoginDestination } from "@/lib/post-login-destination";
import { paths } from "@/routes/paths";

/** Redirects operators away from founder-only surfaces (UX-002…017, etc.). */
export function FounderRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  if (!isFounderPersona(user.role)) {
    return <Navigate to={paths.dashboard.brands} replace />;
  }
  return children;
}

/** UX-001 / UX-002 — Mission Home is founder-only; operators land on Brand Workspace. */
export function RoleBasedHomeRoute({ founderHome }: { founderHome: ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === "operator") {
    return <Navigate to={postLoginDestination(user)} replace />;
  }
  return founderHome;
}
