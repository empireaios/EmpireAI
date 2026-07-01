/**
 * EmpireAI Executive Design System (UX-001A)
 * Shared, reusable UI components every screen can compose. No page logic here.
 */

export { ExecutiveHeader } from "./ExecutiveHeader";
export type { ExecutiveHeaderProps } from "./ExecutiveHeader";

export { ExecutiveSidebar } from "./ExecutiveSidebar";
export type { ExecutiveSidebarProps, ExecutiveNavItem } from "./ExecutiveSidebar";

export { ExecutiveKpiCard, ExecutiveKpiGrid } from "./ExecutiveKpiCard";
export type { ExecutiveKpiCardProps, KpiTrend, KpiTrendDirection, KpiHealth } from "./ExecutiveKpiCard";

export { ExecutivePanel } from "./ExecutivePanel";
export type { ExecutivePanelProps } from "./ExecutivePanel";

export { MissionBriefPanel } from "./MissionBriefPanel";
export type { MissionBriefPanelProps, MissionBriefAction } from "./MissionBriefPanel";

export { ApprovalPanel } from "./ApprovalPanel";
export type { ApprovalPanelProps, ApprovalItem } from "./ApprovalPanel";

export { AlertBanner } from "./AlertBanner";
export type { AlertBannerProps, AlertSeverity } from "./AlertBanner";

export { ExecutiveTable } from "./ExecutiveTable";
export type { ExecutiveTableProps, ExecutiveTableColumn } from "./ExecutiveTable";

export { GlobalFilters } from "./GlobalFilters";
export type { GlobalFiltersProps, GlobalFiltersValue, FilterOption } from "./GlobalFilters";

export { GlobalApprovalBar } from "./GlobalApprovalBar";
export type { GlobalApprovalBarProps } from "./GlobalApprovalBar";

export { GlobalSuccess001BlockerBar } from "./GlobalSuccess001BlockerBar";
export type { GlobalSuccess001BlockerBarProps } from "./GlobalSuccess001BlockerBar";

export { defaultExecutiveNav, EMPIRE_BRAND_ICON } from "./defaultExecutiveNav";

// Professional loading / empty / error states — reuse the existing primitives.
export { LoadingState, ErrorState, EmptyState } from "@/components/ui/PageStates";
