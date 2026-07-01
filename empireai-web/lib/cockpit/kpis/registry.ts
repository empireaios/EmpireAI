import type { CockpitScreenId } from "@/lib/cockpit/types";

export type CockpitDataMode = "live" | "demo" | "sandbox";

export type CockpitKpiDefinition = {
  id: string;
  label: string;
  dataMode: CockpitDataMode;
  screens: readonly CockpitScreenId[];
  placeholderValue: string;
  placeholderTrend?: string;
  description?: string;
};

/** Canonical KPI catalogue — live values resolved via REAL-127 ledger hook. */
export const cockpitKpiRegistry: readonly CockpitKpiDefinition[] = [
  {
    id: "K-E-001",
    label: "GMV MTD",
    dataMode: "live",
    screens: ["SCR-001", "SCR-010"],
    placeholderValue: "$1.24M",
    placeholderTrend: "▲",
    description: "Portfolio GMV month-to-date",
  },
  {
    id: "K-E-002",
    label: "Net Margin",
    dataMode: "live",
    screens: ["SCR-001", "SCR-010"],
    placeholderValue: "36.3%",
    placeholderTrend: "▲",
    description: "Net margin percentage",
  },
  {
    id: "K-E-003",
    label: "Pending Decisions",
    dataMode: "live",
    screens: ["SCR-001"],
    placeholderValue: "3",
    description: "Executive home pending decision count",
  },
  {
    id: "K-E-004",
    label: "Open Missions",
    dataMode: "live",
    screens: ["SCR-001", "SCR-020"],
    placeholderValue: "7",
    description: "Mission centre open mission count",
  },
  {
    id: "K-E-005",
    label: "Companies Building",
    dataMode: "live",
    screens: ["SCR-001", "SCR-010"],
    placeholderValue: "4",
    description: "Active build pipeline count",
  },
  {
    id: "K-E-006",
    label: "Agents Online",
    dataMode: "live",
    screens: ["SCR-010"],
    placeholderValue: "18",
    description: "Online agent roster count",
  },
  {
    id: "K-E-007",
    label: "Pending Decisions",
    dataMode: "live",
    screens: ["SCR-010", "SCR-020"],
    placeholderValue: "3",
    description: "Decisions awaiting founder action",
  },
  {
    id: "K-E-008",
    label: "Open Missions",
    dataMode: "live",
    screens: ["SCR-020"],
    placeholderValue: "7",
    description: "Unified mission queue size",
  },
  {
    id: "K-E-009",
    label: "V1 Readiness",
    dataMode: "demo",
    screens: ["SCR-001", "SCR-704"],
    placeholderValue: "82%",
    description: "V1 certification readiness",
  },
  {
    id: "K-C-001",
    label: "GMV",
    dataMode: "live",
    screens: ["SCR-010"],
    placeholderValue: "$1.24M",
    description: "Command centre GMV snapshot",
  },
  {
    id: "K-C-002",
    label: "Margin",
    dataMode: "live",
    screens: ["SCR-010"],
    placeholderValue: "36.3%",
    description: "Command centre margin snapshot",
  },
  {
    id: "K-C-003",
    label: "Companies",
    dataMode: "live",
    screens: ["SCR-010"],
    placeholderValue: "12",
    description: "Portfolio company count",
  },
  {
    id: "K-C-004",
    label: "Agents",
    dataMode: "live",
    screens: ["SCR-010"],
    placeholderValue: "18",
    description: "Active agents count",
  },
  {
    id: "K-C-005",
    label: "Profit Today",
    dataMode: "live",
    screens: ["SCR-010"],
    placeholderValue: "+$4.2k",
    placeholderTrend: "▲",
    description: "Profit today snapshot",
  },
] as const;

export const EXECUTIVE_HOME_KPI_STRIP_IDS = [
  "K-E-001",
  "K-E-002",
  "K-E-003",
  "K-E-004",
] as const;

export const COMMAND_CENTRE_KPI_STRIP_IDS = [
  "K-C-001",
  "K-C-002",
  "K-C-003",
  "K-C-004",
  "K-C-005",
] as const;

export const cockpitScreenDataModes: Partial<Record<CockpitScreenId, CockpitDataMode>> = {
  "SCR-001": "live",
  "SCR-010": "live",
  "SCR-020": "live",
  "SCR-300": "sandbox",
  "SCR-301": "sandbox",
  "SCR-302": "sandbox",
};

const kpiById = new Map(cockpitKpiRegistry.map((kpi) => [kpi.id, kpi]));

export function getCockpitKpi(id: string) {
  return kpiById.get(id);
}

export function getCockpitKpisByIds(ids: readonly string[]) {
  return ids
    .map((id) => getCockpitKpi(id))
    .filter((kpi): kpi is CockpitKpiDefinition => kpi !== undefined);
}

export function getCockpitKpisForScreen(screenId: CockpitScreenId) {
  return cockpitKpiRegistry.filter((kpi) => kpi.screens.includes(screenId));
}

export function getCockpitScreenDataMode(screenId: CockpitScreenId): CockpitDataMode {
  if (
    (screenId === "SCR-300" || screenId === "SCR-301" || screenId === "SCR-302") &&
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_LIVE_COMMERCE_INTEGRATION_MODE === "production"
  ) {
    return "live";
  }
  return cockpitScreenDataModes[screenId] ?? "demo";
}
