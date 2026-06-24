import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { LandingPage } from "@/pages/public/LandingPage";
import { AdsPage } from "@/pages/dashboard/AdsPage";
import { AiTeamPage } from "@/pages/dashboard/AiTeamPage";
import { BillingPage } from "@/pages/dashboard/BillingPage";
import { IntelligencePage } from "@/pages/dashboard/IntelligencePage";
import { OrdersPage } from "@/pages/dashboard/OrdersPage";
import { ProfitPage } from "@/pages/dashboard/ProfitPage";
import { SettingsPage } from "@/pages/dashboard/SettingsPage";
import { SuppliersPage } from "@/pages/dashboard/SuppliersPage";
import { paths } from "@/routes/paths";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={paths.home} element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route path={paths.login} element={<LoginPage />} />
      </Route>

      <Route path={paths.dashboard.root} element={<DashboardLayout />}>
        <Route index element={<Navigate to={paths.dashboard.profit} replace />} />
        <Route path="profit" element={<ProfitPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="ads" element={<AdsPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="ai-team" element={<AiTeamPage />} />
        <Route path="intelligence" element={<IntelligencePage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="settings/*" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={paths.home} replace />} />
    </Routes>
  );
}
