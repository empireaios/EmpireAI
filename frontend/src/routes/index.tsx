import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { LandingPage } from "@/pages/public/LandingPage";
import { DashboardCockpitRedirect } from "@/routes/DashboardCockpitRedirect";
import { paths } from "@/routes/paths";

/**
 * REAL-126 — Marketing + auth only; /dashboard/* redirects to Cockpit.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path={paths.home} element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route path={paths.login} element={<LoginPage />} />
      </Route>

      <Route path={`${paths.dashboard.root}/*`} element={<DashboardCockpitRedirect />} />

      <Route path="*" element={<Navigate to={paths.home} replace />} />
    </Routes>
  );
}
