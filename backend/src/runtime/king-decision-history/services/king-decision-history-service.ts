import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { buildProductTimelineSummary } from "../../../grand-king-revenue-pipeline/services/revenue-timeline-service.js";
import type { RevenueTimelineEvent } from "../../../grand-king-revenue-pipeline/models/revenue-pipeline-core.js";
import type { KingDecisionHistory } from "../models/king-decision-history.js";

type HistoryItem = KingDecisionHistory["items"][number];

function inferDecision(event: RevenueTimelineEvent): { decision: string; outcome: string; impactUsd: number } {
  const title = event.title.toLowerCase();
  const summary = event.summary.toLowerCase();
  if (title.includes("approve") || event.eventType === "KING_APPROVAL" || summary.includes("approved")) {
    return { decision: "APPROVE", outcome: "Product advanced in pipeline", impactUsd: 2400 };
  }
  if (title.includes("reject") || summary.includes("reject")) {
    return { decision: "REJECT", outcome: "Product blocked or archived", impactUsd: 0 };
  }
  if (event.eventType === "STATE_TRANSITION") {
    return { decision: "TRANSITION", outcome: `State change recorded — ${event.summary}`, impactUsd: 800 };
  }
  return { decision: "REVIEW", outcome: event.summary, impactUsd: 400 };
}

function historyWhy(decision: string, impactUsd: number, productTitle: string): string {
  if (decision === "APPROVE") {
    return `King approved ${productTitle} — unlocks revenue path contributing to SUCCESS-001 (est. $${impactUsd} profit impact)`;
  }
  if (decision === "REJECT") {
    return `King rejected ${productTitle} — protects capital and focus for SUCCESS-001 critical path SKUs`;
  }
  return `King review on ${productTitle} — decision audit trail supports SUCCESS-001 governance (DOCTRINE-005)`;
}

/** REAL-086 — King decision history (GKR pipeline timeline). */
export function buildKingDecisionHistory(
  workspaceId: string,
  companyId: string,
): KingDecisionHistory {
  seedRevenuePipeline(workspaceId, companyId);
  const products = listPipelineProducts(workspaceId, companyId);
  const items: HistoryItem[] = [];

  for (const product of products) {
    const timeline = buildProductTimelineSummary(product);
    const decisionEvents = [
      ...timeline.kingDecisions,
      ...timeline.decisionTimeline,
      ...timeline.executiveOpinions.slice(0, 1),
    ];

    if (decisionEvents.length === 0 && product.kingApproved) {
      items.push({
        itemId: `king-${product.productId}-approved`,
        label: `${product.title} · King approved`,
        score: 85,
        status: "READY",
        recommendation: "Product cleared for publish — monitor post-launch economics",
        evidence: `Pipeline state ${product.state} · kingApproved true`,
        why: historyWhy("APPROVE", 2400, product.title),
      });
      continue;
    }

    for (const event of decisionEvents.slice(0, 3)) {
      const { decision, outcome, impactUsd } = inferDecision(event);
      items.push({
        itemId: `king-${product.productId}-${event.eventId.slice(0, 8)}`,
        label: `${product.title} · ${decision}`,
        score: decision === "APPROVE" ? 85 : decision === "REJECT" ? 20 : 55,
        status: decision === "REJECT" ? "BLOCKED" : decision === "APPROVE" ? "READY" : "PENDING",
        recommendation: outcome,
        evidence: `${event.eventType} · ${event.title} · ${event.recordedAt} · reason: ${event.summary}`,
        why: historyWhy(decision, impactUsd, product.title),
      });
    }
  }

  if (items.length === 0) {
    items.push({
      itemId: "king-no-decisions",
      label: "No King decisions recorded",
      score: 0,
      status: "PENDING",
      recommendation: "Advance products through executive review to King approval queue",
      evidence: `${products.length} pipeline products · 0 timeline decision events`,
      why: "King decision audit trail required before scaling — EC-011 and DOCTRINE-005 govern SUCCESS-001 launches",
    });
  }

  const approvals = items.filter((i) => i.label.includes("APPROVE")).length;
  const rejections = items.filter((i) => i.label.includes("REJECT")).length;
  const summary = `REAL-086 · King decision history · ${products.length} products · ${approvals} approvals · ${rejections} rejections · ${items.length} timeline events`;

  return {
    moduleId: "king-decision-history",
    missionId: "REAL-086",
    workspaceId,
    companyId,
    summary,
    items,
    reusedModules: ["grand-king-revenue-pipeline"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
