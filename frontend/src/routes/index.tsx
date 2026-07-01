import { Navigate, Route, Routes } from "react-router-dom";
import { FounderRoute, RoleBasedHomeRoute } from "@/components/auth/RoleBasedHomeRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { AdsPage } from "@/pages/dashboard/AdsPage";
import { AiTeamPage } from "@/pages/dashboard/AiTeamPage";
import { ApprovalsPage } from "@/pages/dashboard/ApprovalsPage";
import { BusinessDetailPage } from "@/pages/dashboard/BusinessDetailPage";
import { BusinessPreviewPage } from "@/pages/dashboard/BusinessPreviewPage";
import { BusinessWorkspacePage } from "@/pages/dashboard/BusinessWorkspacePage";
import { EmpireCommandCenterPage } from "@/pages/dashboard/EmpireCommandCenterPage";
import { ExecutiveDebatePage } from "@/pages/dashboard/ExecutiveDebatePage";
import { ExpansionPage } from "@/pages/dashboard/ExpansionPage";
import { IntegrationsHubPage } from "@/pages/dashboard/IntegrationsHubPage";
import { InfrastructurePage } from "@/pages/dashboard/InfrastructurePage";
import { KingDecisionHistoryPage } from "@/pages/dashboard/KingDecisionHistoryPage";
import { LaunchCenterPage } from "@/pages/dashboard/LaunchCenterPage";
import { MarketplaceIntelligencePage } from "@/pages/dashboard/MarketplaceIntelligencePage";
import { MissionHomePage } from "@/pages/dashboard/MissionHomePage";
import { OperatingCostPage } from "@/pages/dashboard/OperatingCostPage";
import { OrdersPage } from "@/pages/dashboard/OrdersPage";
import { ProductDiscoveryPage } from "@/pages/dashboard/ProductDiscoveryPage";
import { ReportsPage } from "@/pages/dashboard/ReportsPage";
import { SoulDecisionChamberPage } from "@/pages/dashboard/SoulDecisionChamberPage";
import { Success001CommandCenterPage } from "@/pages/dashboard/Success001CommandCenterPage";
import { SuppliersPage } from "@/pages/dashboard/SuppliersPage";
import { BillingPage } from "@/pages/dashboard/BillingPage";
import { CommercialExplorerPage } from "@/pages/dashboard/IntelligencePage";
import { PillowCompanionRouteRedirect } from "@/pages/dashboard/PillowCompanionRouteRedirect";
import { ExecutiveLearningReviewPage } from "@/pages/dashboard/ExecutiveLearningReviewPage";
import { SettingsPage } from "@/pages/dashboard/SettingsPage";
import { LandingPage } from "@/pages/public/LandingPage";
import { LegacyBusinessPreviewRedirect, LegacyBusinessRedirect } from "@/routes/legacy-redirects";
import { paths } from "@/routes/paths";

export function AppRoutes() {
  return (
    <Routes>
      <Route path={paths.home} element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route path={paths.login} element={<LoginPage />} />
      </Route>

      <Route
        path={paths.dashboard.root}
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleBasedHomeRoute founderHome={<MissionHomePage />} />} />
        <Route path="command" element={<FounderRoute><EmpireCommandCenterPage /></FounderRoute>} />
        <Route path="success-001" element={<FounderRoute><Success001CommandCenterPage /></FounderRoute>} />
        <Route path="debate" element={<FounderRoute><ExecutiveDebatePage /></FounderRoute>} />
        <Route path="soul" element={<FounderRoute><SoulDecisionChamberPage /></FounderRoute>} />
        <Route path="approvals" element={<FounderRoute><ApprovalsPage /></FounderRoute>} />
        <Route path="king-history" element={<FounderRoute><KingDecisionHistoryPage /></FounderRoute>} />
        <Route path="ai-team" element={<FounderRoute><AiTeamPage /></FounderRoute>} />
        <Route path="operating-cost" element={<FounderRoute><OperatingCostPage /></FounderRoute>} />
        <Route path="reports" element={<FounderRoute><ReportsPage /></FounderRoute>} />
        <Route path="intelligence" element={<FounderRoute><ProductDiscoveryPage /></FounderRoute>} />
        <Route path="suppliers" element={<FounderRoute><SuppliersPage /></FounderRoute>} />
        <Route path="marketplaces" element={<FounderRoute><MarketplaceIntelligencePage /></FounderRoute>} />
        <Route path="advertising" element={<FounderRoute><AdsPage /></FounderRoute>} />
        <Route path="expansion" element={<FounderRoute><ExpansionPage /></FounderRoute>} />
        <Route path="brands" element={<BusinessWorkspacePage />} />
        <Route path="brands/:opportunityId" element={<BusinessDetailPage />} />
        <Route path="brands/:opportunityId/preview" element={<BusinessPreviewPage />} />
        <Route path="launch" element={<LaunchCenterPage />} />
        <Route path="operations" element={<FounderRoute><OrdersPage /></FounderRoute>} />
        <Route path="integrations" element={<FounderRoute><IntegrationsHubPage /></FounderRoute>} />
        <Route path="infrastructure/*" element={<FounderRoute><InfrastructurePage /></FounderRoute>} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="billing" element={<FounderRoute><BillingPage /></FounderRoute>} />
        <Route path="explorer" element={<FounderRoute><CommercialExplorerPage /></FounderRoute>} />
        <Route path="pillow" element={<FounderRoute><PillowCompanionRouteRedirect /></FounderRoute>} />
        <Route path="pillow/learning" element={<FounderRoute><ExecutiveLearningReviewPage /></FounderRoute>} />

        {/* Legacy redirects */}
        <Route path="discovery" element={<Navigate to={paths.dashboard.intelligence} replace />} />
        <Route path="businesses" element={<Navigate to={paths.dashboard.brands} replace />} />
        <Route path="businesses/:opportunityId" element={<LegacyBusinessRedirect />} />
        <Route path="businesses/:opportunityId/preview" element={<LegacyBusinessPreviewRedirect />} />
        <Route path="orders" element={<Navigate to={paths.dashboard.operations} replace />} />

        <Route path="*" element={<Navigate to={paths.dashboard.home} replace />} />
      </Route>

      <Route path="*" element={<Navigate to={paths.home} replace />} />
    </Routes>
  );
}
