import { randomUUID } from "node:crypto";

import { buildExecutiveHeadquartersDashboard } from "../../executive-council/services/executive-headquarters-service.js";
import { buildExecutiveBriefings } from "../../executive-surveillance/services/executive-briefing-service.js";
import { listActiveSignals } from "../../executive-surveillance/services/signal-engine-service.js";
import { listSurveillanceMissions } from "../../executive-surveillance/services/mission-generator-service.js";
import { buildAiChiefOfCommerce } from "../../runtime/ai-chief-of-commerce/services/ai-chief-of-commerce-service.js";
import { buildAiChiefOfGrowth } from "../../runtime/ai-chief-of-growth/services/ai-chief-of-growth-service.js";
import { buildAiChiefOfCustomer } from "../../runtime/ai-chief-of-customer/services/ai-chief-of-customer-service.js";
import type { AssistantEvidence } from "../models/global-assistant.js";
import {
  buildAssistantContextBundle,
  journeyEvidenceFromContext,
  repositoryEvidenceFromContext,
} from "./context-service.js";

function evidence(source: AssistantEvidence["source"], title: string, summary: string, moduleId?: string): AssistantEvidence {
  return {
    evidenceId: randomUUID(),
    source,
    title,
    summary,
    moduleId,
    recordedAt: new Date().toISOString(),
  };
}

/** GC-05 — Live evidence from REAL-031/032/033 + Council + ESS (no hardcoded KPI text). */
export function gatherChiefEvidence(workspaceId: string, companyId: string): AssistantEvidence[] {
  const results: AssistantEvidence[] = [];
  try {
    const commerce = buildAiChiefOfCommerce(workspaceId, companyId);
    for (const rec of commerce.executiveRecommendations.slice(0, 4)) {
      results.push(evidence("REAL-031", rec.title, rec.evidence, "ai-chief-of-commerce"));
    }
    for (const insight of commerce.pricingInsights.slice(0, 2)) {
      results.push(evidence("REAL-031", "Pricing insight", insight, "ai-chief-of-commerce"));
    }
  } catch {
    /* optional */
  }

  try {
    const growth = buildAiChiefOfGrowth(workspaceId, companyId);
    for (const rec of growth.growthRecommendations.slice(0, 4)) {
      results.push(evidence("REAL-032", rec.title, rec.evidence, "ai-chief-of-growth"));
    }
  } catch {
    /* optional */
  }

  try {
    const customer = buildAiChiefOfCustomer(workspaceId, companyId);
    for (const rec of customer.customerRecommendations.slice(0, 4)) {
      results.push(evidence("REAL-033", rec.title, rec.evidence, "ai-chief-of-customer"));
    }
  } catch {
    /* optional */
  }

  return results;
}

export function gatherCouncilEvidence(workspaceId: string, companyId: string): AssistantEvidence[] {
  const results: AssistantEvidence[] = [];
  try {
    const hq = buildExecutiveHeadquartersDashboard(workspaceId, companyId);
    for (const rec of hq.recommendationsAwaitingKing.slice(0, 3)) {
      results.push(
        evidence(
          "executive-council",
          `Council: ${rec.topic}`,
          rec.majorityRecommendation ?? "Review council recommendation",
          "executive-council",
        ),
      );
    }
    if (hq.consensus) {
      results.push(
        evidence(
          "executive-council",
          "Latest council consensus",
          String(hq.consensus).replace(/_/g, " "),
          "executive-council",
        ),
      );
    }
  } catch {
    /* optional */
  }
  return results;
}

export function gatherEssEvidence(workspaceId: string, companyId: string): AssistantEvidence[] {
  const results: AssistantEvidence[] = [];
  try {
    const signals = listActiveSignals(workspaceId, companyId);
    const missions = listSurveillanceMissions(workspaceId, companyId);
    const briefings = buildExecutiveBriefings(signals, missions);
    const morning = briefings.find((b) => b.type === "MORNING");
    if (morning) {
      results.push(evidence("executive-surveillance", morning.title, morning.summary, "executive-surveillance"));
    }
    for (const signal of signals.slice(0, 5)) {
      results.push(
        evidence("executive-surveillance", signal.title, signal.summary, signal.affectedModules[0]),
      );
    }
  } catch {
    /* optional */
  }
  return results;
}

export function gatherAllEvidence(
  workspaceId: string,
  companyId: string,
  screenPath: string,
  kpiLabel?: string,
): AssistantEvidence[] {
  const context = buildAssistantContextBundle(workspaceId, companyId, screenPath, kpiLabel);
  const all = [
    ...gatherChiefEvidence(workspaceId, companyId),
    ...gatherCouncilEvidence(workspaceId, companyId),
    ...gatherEssEvidence(workspaceId, companyId),
    ...journeyEvidenceFromContext(context.journey.rows),
    ...repositoryEvidenceFromContext(context.repository.snippets),
  ];

  if (!kpiLabel?.trim()) return all;

  const normalized = kpiLabel.trim().toLowerCase();
  const matched = all.filter(
    (item) =>
      item.title.toLowerCase().includes(normalized) ||
      item.summary.toLowerCase().includes(normalized) ||
      normalized.includes(item.source.toLowerCase()),
  );
  return matched.length > 0 ? matched : all.slice(0, 8);
}

export function buildWhyResponse(
  workspaceId: string,
  companyId: string,
  screenPath: string,
  kpiLabel: string,
  kpiValue?: string,
) {
  const evidenceItems = gatherAllEvidence(workspaceId, companyId, screenPath, kpiLabel);
  const context = buildAssistantContextBundle(workspaceId, companyId, screenPath, kpiLabel);
  const headline = kpiValue
    ? `${kpiLabel} is ${kpiValue} on ${context.screen.screenTitle}.`
    : `Evidence for "${kpiLabel}" on ${context.screen.screenTitle}.`;

  const summary =
    evidenceItems.length > 0
      ? evidenceItems
          .slice(0, 5)
          .map((e) => `• [${e.source}] ${e.title}: ${e.summary}`)
          .join("\n")
      : "No live evidence matched this KPI — chiefs are standing by with recommend-only outputs.";

  return {
    kpiLabel,
    kpiValue: kpiValue ?? null,
    headline,
    summary,
    evidence: evidenceItems,
    recommendOnly: true,
    screen: context.screen,
    computedAt: new Date().toISOString(),
  };
}
