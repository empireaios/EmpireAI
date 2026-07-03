/**
 * REAL-125 — Shared Cockpit UI primitives.
 * Canonical imports for Cockpit surfaces; PlatformPrimitives remain for legacy platform modules.
 */
export { CockpitStatCard } from "./CockpitStatCard";
export { CockpitDataTable } from "./CockpitDataTable";
export { CockpitPanel } from "./CockpitPanel";
export { CockpitPageHeader } from "./CockpitPageHeader";
export { CockpitActionButton } from "./CockpitActionButton";
export { CockpitBadge } from "./CockpitBadge";
export {
  CockpitLoadingState,
  CockpitEmptyState,
  CockpitErrorState,
  CockpitPanelState,
} from "./CockpitStates";
export { CockpitHealthBadge, engineHealthToStatus } from "./CockpitHealthBadge";
export { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
export { StatusBadge, statusBadgeVariant } from "@/components/cockpit/widgets/shared/statusBadges";
