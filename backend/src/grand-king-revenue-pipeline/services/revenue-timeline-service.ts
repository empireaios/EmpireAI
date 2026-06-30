import { randomUUID } from "node:crypto";

import type { PipelineProduct, RevenueTimelineEvent } from "../models/revenue-pipeline-core.js";

export function appendTimelineEvent(
  product: PipelineProduct,
  input: {
    eventType: string;
    title: string;
    summary: string;
    sourceModule?: string;
  },
): RevenueTimelineEvent {
  const event: RevenueTimelineEvent = {
    eventId: randomUUID(),
    productId: product.productId,
    eventType: input.eventType,
    title: input.title,
    summary: input.summary,
    sourceModule: input.sourceModule,
    recordedAt: new Date().toISOString(),
  };
  product.timeline.push(event);
  return event;
}

/** GKR-004 — Product decision and commercial history timeline. */
export function buildProductTimelineSummary(product: PipelineProduct): {
  history: RevenueTimelineEvent[];
  decisionTimeline: RevenueTimelineEvent[];
  executiveOpinions: RevenueTimelineEvent[];
  kingDecisions: RevenueTimelineEvent[];
  marketplaceHistory: RevenueTimelineEvent[];
  commercialScoreHistory: RevenueTimelineEvent[];
} {
  const history = product.timeline;
  return {
    history,
    decisionTimeline: history.filter((e) => e.eventType.includes("DECISION") || e.eventType === "STATE_TRANSITION"),
    executiveOpinions: history.filter((e) => e.sourceModule === "executive-council" || e.eventType === "EXECUTIVE_OPINION"),
    kingDecisions: history.filter((e) => e.eventType === "KING_APPROVAL" || e.title.toLowerCase().includes("king")),
    marketplaceHistory: history.filter((e) => e.sourceModule?.includes("amazon") || e.sourceModule?.includes("commerce-runtime") || e.eventType === "MARKETPLACE"),
    commercialScoreHistory: history.filter((e) => e.eventType === "COMMERCIAL_SCORE" || e.title.toLowerCase().includes("commercial")),
  };
}
