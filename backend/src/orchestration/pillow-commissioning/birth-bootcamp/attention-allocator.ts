/**
 * Economically intelligent attention allocation for large portfolios.
 * Tier-0/1 deterministic — no LLM. Used by Bootcamp scale scenarios and
 * available as reusable executive infrastructure.
 *
 * Does NOT hard-code specific products/corridors.
 */

export type PortfolioEntity = {
  entityId: string;
  asin: string;
  title: string;
  corridor: string;
  /** Realised economics — UNKNOWN stays null */
  realisedRevenueUsd: number | null;
  realisedOrders: number | null;
  expectedProfitUsd: number | null;
  marginPct: number | null;
  stockOut: boolean;
  deliveryBreach: boolean;
  priceShockPct: number | null;
  daysSinceLastSignal: number;
  publishState: "DRAFT" | "LISTED" | "BUYABLE" | "PAUSED" | "UNKNOWN";
};

export type AttentionTier = "TIER_0_MONITOR" | "TIER_1_RANK" | "TIER_2_JUDGE" | "TIER_3_OWNER";

export type AttentionDecision = {
  entityId: string;
  tier: AttentionTier;
  score: number;
  reasons: string[];
};

export type AttentionPlan = {
  portfolioSize: number;
  decisions: AttentionDecision[];
  tierCounts: Record<AttentionTier, number>;
  principle:
    | "BROAD_SCREEN_THEN_SELECTIVE_INTELLIGENCE"
    | "EQUAL_ATTENTION_FORBIDDEN";
};

function exposure(e: PortfolioEntity): number {
  const realised = Math.max(0, e.realisedRevenueUsd ?? 0);
  const expected = Math.max(0, e.expectedProfitUsd ?? 0) * 10;
  return realised + expected;
}

function exceptionScore(e: PortfolioEntity): number {
  let s = 0;
  if (e.stockOut) s += 40;
  if (e.deliveryBreach) s += 35;
  if ((e.priceShockPct ?? 0) >= 15) s += 30;
  if (e.publishState === "BUYABLE" && (e.realisedOrders ?? 0) === 0 && e.daysSinceLastSignal > 14) {
    s += 20;
  }
  if ((e.marginPct ?? 100) < 5) s += 25;
  return s;
}

/**
 * Allocate attention: most entities stay Tier-0; only material exceptions /
 * high exposure rise. Exhaustive deep analysis of every SKU is a FAIL pattern.
 */
export function allocatePortfolioAttention(
  entities: PortfolioEntity[],
  opts?: { tier2Budget?: number; tier3Budget?: number },
): AttentionPlan {
  const tier2Budget = opts?.tier2Budget ?? Math.max(3, Math.ceil(entities.length * 0.02));
  const tier3Budget = opts?.tier3Budget ?? Math.max(1, Math.ceil(entities.length * 0.005));

  const ranked = entities
    .map((e) => {
      const exp = exposure(e);
      const exc = exceptionScore(e);
      const score = exp * 0.01 + exc;
      const reasons: string[] = [];
      if (exc >= 30) reasons.push("material_exception");
      if (exp >= 500) reasons.push("high_economic_exposure");
      if (e.stockOut) reasons.push("stock_out");
      if (e.deliveryBreach) reasons.push("delivery_breach");
      if ((e.marginPct ?? 100) < 5) reasons.push("margin_collapse");
      return { e, score, reasons };
    })
    .sort((a, b) => b.score - a.score);

  const decisions: AttentionDecision[] = [];
  let t2 = 0;
  let t3 = 0;

  for (const row of ranked) {
    let tier: AttentionTier = "TIER_0_MONITOR";
    if (row.score >= 50 && t3 < tier3Budget) {
      tier = "TIER_3_OWNER";
      t3 += 1;
      row.reasons.push("owner_attention_budget");
    } else if (row.score >= 25 && t2 < tier2Budget) {
      tier = "TIER_2_JUDGE";
      t2 += 1;
      row.reasons.push("selective_ai_judgment");
    } else if (row.score >= 10) {
      tier = "TIER_1_RANK";
      row.reasons.push("cheap_ranking_delta");
    } else {
      row.reasons.push("deterministic_monitor_only");
    }
    decisions.push({
      entityId: row.e.entityId,
      tier,
      score: Math.round(row.score * 100) / 100,
      reasons: row.reasons,
    });
  }

  const tierCounts: Record<AttentionTier, number> = {
    TIER_0_MONITOR: 0,
    TIER_1_RANK: 0,
    TIER_2_JUDGE: 0,
    TIER_3_OWNER: 0,
  };
  for (const d of decisions) tierCounts[d.tier] += 1;

  return {
    portfolioSize: entities.length,
    decisions,
    tierCounts,
    principle: "BROAD_SCREEN_THEN_SELECTIVE_INTELLIGENCE",
  };
}

/** Oracle: deep-analysis share must stay small at scale. */
export function attentionPlanIsScaleCompatible(plan: AttentionPlan): {
  pass: boolean;
  detail: string;
} {
  if (plan.portfolioSize < 100) {
    return { pass: true, detail: "small_portfolio_exempt" };
  }
  const deep = plan.tierCounts.TIER_2_JUDGE + plan.tierCounts.TIER_3_OWNER;
  const deepShare = deep / plan.portfolioSize;
  const pass = deepShare <= 0.05 && plan.tierCounts.TIER_0_MONITOR >= plan.portfolioSize * 0.7;
  return {
    pass,
    detail: `deepShare=${deepShare.toFixed(4)} tier0=${plan.tierCounts.TIER_0_MONITOR}`,
  };
}
