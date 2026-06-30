import { randomUUID } from "node:crypto";

import type { ExecutiveBriefing } from "../models/surveillance-dashboard.js";
import type { ExecutiveSignal } from "../models/surveillance-core.js";
import type { ExecutiveSurveillanceMission } from "../models/surveillance-core.js";
import { getRiskSignals, getOpportunitySignals, getExpansionSignals } from "./signal-engine-service.js";

/** ESS-005 — Executive Briefing (architecture only, no scheduling). */
export function buildExecutiveBriefings(
  signals: ExecutiveSignal[],
  missions: ExecutiveSurveillanceMission[],
): ExecutiveBriefing[] {
  const now = new Date().toISOString();
  const risks = getRiskSignals(signals);
  const opportunities = getOpportunitySignals(signals);
  const expansion = getExpansionSignals(signals);
  const commercial = signals.filter((s) => s.affectedModules.includes("commerce-intelligence-studio"));
  const financial = signals.filter((s) => s.watcherId === "finance-watcher" || s.affectedModules.includes("operation-first-dollar"));
  const operations = signals.filter((s) => s.watcherId === "operations-watcher" || s.affectedModules.includes("commerce-runtime"));

  return [
    {
      briefingId: randomUUID(),
      type: "MORNING",
      title: "CEO Morning Brief",
      summary: buildMorningSummary(signals, missions),
      highlights: missions.slice(0, 5).map((m) => m.title),
      generatedAt: now,
    },
    {
      briefingId: randomUUID(),
      type: "COMMERCIAL",
      title: "Commercial Brief",
      summary: commercial.length > 0 ? `${commercial.length} commercial signal(s) detected across CIS and marketplace modules.` : "Commercial pipeline stable — no critical signals.",
      highlights: commercial.slice(0, 4).map((s) => s.title),
      generatedAt: now,
    },
    {
      briefingId: randomUUID(),
      type: "EXPANSION",
      title: "Expansion Brief",
      summary: expansion.length > 0 ? `${expansion.length} expansion opportunity signal(s) from global commerce modules.` : "No expansion signals requiring immediate attention.",
      highlights: expansion.slice(0, 4).map((s) => s.title),
      generatedAt: now,
    },
    {
      briefingId: randomUUID(),
      type: "RISK",
      title: "Risk Brief",
      summary: risks.length > 0 ? `${risks.length} risk/warning signal(s) across the empire.` : "Risk posture nominal.",
      highlights: risks.slice(0, 4).map((s) => s.title),
      generatedAt: now,
    },
    {
      briefingId: randomUUID(),
      type: "FINANCIAL",
      title: "Financial Brief",
      summary: financial.length > 0 ? `${financial.length} financial signal(s) from OFD and finance watcher.` : "Financial signals within normal range.",
      highlights: financial.slice(0, 3).map((s) => s.title),
      generatedAt: now,
    },
    {
      briefingId: randomUUID(),
      type: "OPERATIONS",
      title: "Operations Brief",
      summary: operations.length > 0 ? `${operations.length} operations signal(s) from runtime and automation.` : "Operations running smoothly.",
      highlights: operations.slice(0, 3).map((s) => s.title),
      generatedAt: now,
    },
  ];
}

function buildMorningSummary(signals: ExecutiveSignal[], missions: ExecutiveSurveillanceMission[]): string {
  const critical = signals.filter((s) => s.priority === "CRITICAL").length;
  const today = missions.filter((m) => m.category === "TODAY" || m.category === "QUICK_WIN").length;
  return `Good morning, King. Surveillance detected ${signals.length} signal(s), ${critical} critical. ${today} mission(s) queued for today. Watchers observe — Council debates — you decide.`;
}

export function getCeoMorningBrief(briefings: ExecutiveBriefing[]): ExecutiveBriefing {
  return briefings.find((b) => b.type === "MORNING") ?? briefings[0]!;
}
