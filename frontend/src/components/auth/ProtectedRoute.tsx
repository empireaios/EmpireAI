import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { paths } from "@/routes/paths";
import { LoadingState } from "@/components/ui/PageStates";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState message="Checking session…" />;
  }

  if (!user) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname }} />;
  }

  return children;
}
