import type { ExecutiveSummaryCard, ExecutiveWidgetDataMode } from "@/lib/cockpit/panel-types";

/** G4-06 — canonical priority widget catalogue (documentation + registry). */
export const EXECUTIVE_PRIORITY_WIDGETS = [
  {
    widgetId: "G4-06-W01",
    cardId: "empire-health",
    title: "Empire Health",
    brainModule: "executive-home",
    brainAction: "load",
  },
  {
    widgetId: "G4-06-W02",
    cardId: "marketplace-status",
    title: "Marketplace Health",
    brainModule: "executive-home",
    brainAction: "load",
  },
  {
    widgetId: "G4-06-W03",
    cardId: "supplier-status",
    title: "Supplier Health",
    brainModule: "executive-home",
    brainAction: "load",
  },
  {
    widgetId: "G4-06-W04",
    cardId: "revenue-today",
    title: "Revenue Summary",
    brainModule: "executive-home",
    brainAction: "load",
  },
  {
    widgetId: "G4-06-W05",
    cardId: "active-missions",
    title: "Active Missions",
    brainModule: "executive-home",
    brainAction: "load",
  },
  {
    widgetId: "G4-06-W06",
    cardId: "pillow-status",
    title: "Pillow Status",
    brainModule: "executive-home",
    brainAction: "load",
  },
  {
    widgetId: "G4-06-W07",
    cardId: "executive-alerts",
    title: "Executive Alerts",
    brainModule: "executive-home",
    brainAction: "load",
    panelComponent: "ExecutiveAlertsPanel",
  },
  {
    widgetId: "G4-06-W08",
    cardId: "pending-kings-approval",
    title: "Pending King's Approval",
    brainModule: "executive-home",
    brainAction: "load",
  },
  {
    widgetId: "G4-06-W09",
    cardId: "executive-timeline",
    title: "Recent Executive Timeline",
    brainModule: "executive-home",
    brainAction: "load",
    panelComponent: "ExecutiveTimelinePanel",
  },
  {
    widgetId: "G4-06-W10",
    cardId: "ai-recommendations",
    title: "AI Recommendation Summary",
    brainModule: "executive-home",
    brainAction: "load",
  },
] as const;

export function getExecutiveWidgetByCardId(cardId: string) {
  return EXECUTIVE_PRIORITY_WIDGETS.find((w) => w.cardId === cardId);
}

export function isLiveWidgetData(card: ExecutiveSummaryCard): boolean {
  return card.liveDataAvailable && card.primaryValue !== null;
}

export function widgetDataModeLabel(mode: ExecutiveWidgetDataMode): string {
  if (mode === "live") return "Live";
  if (mode === "sandbox") return "Sandbox";
  return "Unavailable";
}
