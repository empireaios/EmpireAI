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
