/** P7-02 — Canonical executive widget registry. */

import type { CockpitWidget } from "@/lib/cockpit-ux/types";

export type CockpitWidgetDefinition = {
  id: CockpitWidget;
  label: string;
  description: string;
  defaultRefreshMs: number;
  component: string;
};

export const COCKPIT_WIDGET_REGISTRY: readonly CockpitWidgetDefinition[] = [
  {
    id: "empire_health",
    label: "Empire Health",
    description: "Composite executive health across all centres",
    defaultRefreshMs: 30_000,
    component: "ExecutiveEmpireAwarenessStrip",
  },
  {
    id: "mission_progress",
    label: "Mission Progress",
    description: "Active mission progress · OMS · queue",
    defaultRefreshMs: 15_000,
    component: "MissionQueuePreviewLive",
  },
  {
    id: "builder",
    label: "Builder",
    description: "Builder Console status · repository · recovery",
    defaultRefreshMs: 15_000,
    component: "BuilderConsoleDashboard",
  },
  {
    id: "supervisor",
    label: "Supervisor",
    description: "Current mission · step · ETA · recovery",
    defaultRefreshMs: 10_000,
    component: "SupervisorCentreDashboard",
  },
  {
    id: "journey",
    label: "Journey",
    description: "Roadmap position · constitutional journey",
    defaultRefreshMs: 60_000,
    component: "JourneyCentreDashboard",
  },
  {
    id: "production",
    label: "Production",
    description: "Production Truth · deployment · browser verification",
    defaultRefreshMs: 30_000,
    component: "ProductionCentreDashboard",
  },
  {
    id: "business_health",
    label: "Business Health",
    description: "Portfolio · factory · commerce health",
    defaultRefreshMs: 30_000,
    component: "PortfolioPulseLive",
  },
  {
    id: "revenue",
    label: "Revenue",
    description: "Commerce revenue · operating model",
    defaultRefreshMs: 60_000,
    component: "CommerceOperatingStrip",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Alerts · Brain SSE · escalation",
    defaultRefreshMs: 15_000,
    component: "ExecutiveAlertsPanel",
  },
  {
    id: "recommendations",
    label: "Recommendations",
    description: "Pillow recommendations · explainability",
    defaultRefreshMs: 15_000,
    component: "ExecutiveNextActionStrip",
  },
  {
    id: "current_risks",
    label: "Current Risks",
    description: "Guardian runtime · infrastructure · availability",
    defaultRefreshMs: 15_000,
    component: "ExecutiveAttentionStrip",
  },
] as const;

export function getCockpitWidgetById(id: CockpitWidget) {
  return COCKPIT_WIDGET_REGISTRY.find((w) => w.id === id);
}
