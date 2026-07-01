import type { CockpitDepartmentId } from "@/lib/cockpit/navigation";
import type { CockpitScreenId } from "@/lib/cockpit/types";
import type { CockpitDataMode } from "@/lib/cockpit/kpis/registry";

export type CockpitWidgetDefinition = {
  id: string;
  label: string;
  /** Placeholder component export name in components/cockpit/widgets. */
  component: string;
  dataMode: CockpitDataMode;
  screens: readonly CockpitScreenId[];
  department: CockpitDepartmentId | "executive" | "command" | "missions";
  placeholder: true;
};

/** Canonical widget catalogue — maps REAL-079 IDs to placeholder implementations. */
export const cockpitWidgetRegistry: readonly CockpitWidgetDefinition[] = [
  {
    id: "W-E-001",
    label: "Grand King Greeting",
    component: "ExecutiveHomeGreeting",
    dataMode: "live",
    screens: ["SCR-001"],
    department: "executive",
    placeholder: true,
  },
  {
    id: "W-E-002",
    label: "Command Snapshot",
    component: "CommandSnapshotPlaceholder",
    dataMode: "live",
    screens: ["SCR-001", "SCR-010"],
    department: "command",
    placeholder: true,
  },
  {
    id: "W-E-003",
    label: "Mission Queue Preview",
    component: "MissionQueuePreviewPlaceholder",
    dataMode: "live",
    screens: ["SCR-001", "SCR-020"],
    department: "missions",
    placeholder: true,
  },
  {
    id: "W-E-004",
    label: "Portfolio Pulse",
    component: "PortfolioPulsePlaceholder",
    dataMode: "live",
    screens: ["SCR-001", "SCR-010"],
    department: "command",
    placeholder: true,
  },
  {
    id: "W-E-005",
    label: "Department Health Row",
    component: "DepartmentHealthRowPlaceholder",
    dataMode: "live",
    screens: ["SCR-001"],
    department: "executive",
    placeholder: true,
  },
  {
    id: "W-E-006",
    label: "AI CEO Briefing",
    component: "AiCeoBriefingPlaceholder",
    dataMode: "live",
    screens: ["SCR-010"],
    department: "command",
    placeholder: true,
  },
  {
    id: "W-E-007",
    label: "Pending Decisions",
    component: "PendingDecisionsPlaceholder",
    dataMode: "live",
    screens: ["SCR-010", "SCR-020"],
    department: "command",
    placeholder: true,
  },
  {
    id: "W-E-008",
    label: "Company Portfolio Table",
    component: "PortfolioOverviewPlaceholder",
    dataMode: "live",
    screens: ["SCR-010"],
    department: "command",
    placeholder: true,
  },
  {
    id: "W-E-009",
    label: "Activity Feed",
    component: "AgentActivityPlaceholder",
    dataMode: "demo",
    screens: ["SCR-001", "SCR-010"],
    department: "command",
    placeholder: true,
  },
  {
    id: "W-E-010",
    label: "Mission Blocker Strip",
    component: "MissionBlockerStripPlaceholder",
    dataMode: "demo",
    screens: ["SCR-020"],
    department: "missions",
    placeholder: true,
  },
  {
    id: "W-E-011",
    label: "Mission Approval Triage",
    component: "MissionApprovalTriageColumnsPlaceholder",
    dataMode: "live",
    screens: ["SCR-020"],
    department: "missions",
    placeholder: true,
  },
  {
    id: "W-E-012",
    label: "Mission Queue Full",
    component: "MissionQueueFullPlaceholder",
    dataMode: "live",
    screens: ["SCR-020"],
    department: "missions",
    placeholder: true,
  },
  {
    id: "W-E-013",
    label: "KPI Strip",
    component: "KpiStrip",
    dataMode: "live",
    screens: ["SCR-001", "SCR-010"],
    department: "executive",
    placeholder: true,
  },
  {
    id: "W-C-001",
    label: "Commerce Marketing Panel",
    component: "CommerceMarketingPanel",
    dataMode: "demo",
    screens: ["SCR-202"],
    department: "commerce",
    placeholder: true,
  },
  {
    id: "W-C-002",
    label: "Commerce Ads Panel",
    component: "CommerceAdsPanel",
    dataMode: "demo",
    screens: ["SCR-203"],
    department: "commerce",
    placeholder: true,
  },
  {
    id: "W-C-003",
    label: "Commerce Workspace Panel",
    component: "CommerceWorkspacePanel",
    dataMode: "demo",
    screens: ["SCR-204"],
    department: "commerce",
    placeholder: true,
  },
  {
    id: "W-I-001",
    label: "Intelligence Overview Panel",
    component: "IntelligenceOverviewPanel",
    dataMode: "demo",
    screens: ["SCR-100"],
    department: "intelligence",
    placeholder: true,
  },
  {
    id: "W-O-001",
    label: "Operations Orders Panel",
    component: "OperationsOrdersPanel",
    dataMode: "sandbox",
    screens: ["SCR-300"],
    department: "operations",
    placeholder: true,
  },
  {
    id: "W-F-001",
    label: "Finance Dashboard Panel",
    component: "FinanceDashboardPanel",
    dataMode: "demo",
    screens: ["SCR-400"],
    department: "finance",
    placeholder: true,
  },
  {
    id: "W-W-001",
    label: "Workforce Agents Panel",
    component: "WorkforceAgentsPanel",
    dataMode: "demo",
    screens: ["SCR-500"],
    department: "workforce",
    placeholder: true,
  },
  {
    id: "W-N-001",
    label: "Infrastructure Integrations Panel",
    component: "InfrastructureIntegrationsPanel",
    dataMode: "demo",
    screens: ["SCR-600"],
    department: "infrastructure",
    placeholder: true,
  },
  {
    id: "W-G-001",
    label: "Governance Policies Panel",
    component: "GovernancePoliciesPanel",
    dataMode: "demo",
    screens: ["SCR-700"],
    department: "governance",
    placeholder: true,
  },
  {
    id: "W-D-001",
    label: "Development Pillow Panel",
    component: "DevelopmentPillowPanel",
    dataMode: "demo",
    screens: ["SCR-800"],
    department: "development",
    placeholder: true,
  },
] as const;

const widgetById = new Map(cockpitWidgetRegistry.map((widget) => [widget.id, widget]));

export function getCockpitWidget(id: string) {
  return widgetById.get(id);
}

export function getCockpitWidgetsForScreen(screenId: CockpitScreenId) {
  return cockpitWidgetRegistry.filter((widget) => widget.screens.includes(screenId));
}

export function getCockpitWidgetsByComponent(component: string) {
  return cockpitWidgetRegistry.filter((widget) => widget.component === component);
}
