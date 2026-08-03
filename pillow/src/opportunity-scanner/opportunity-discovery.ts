import type { OpportunityCategory, OpportunityScores } from "./types.js";

type DomainBlueprint = {
  domain: string;
  category: OpportunityCategory;
  signal: string;
  summary: string;
  valueHypothesis: string;
  nextStep: string;
  base: OpportunityScores;
};

/** Structural domain blueprints — discovery without executing opportunities. */
export const DOMAIN_BLUEPRINTS: DomainBlueprint[] = [
  {
    domain: "market_expansion",
    category: "business",
    signal: "structural://market_gap",
    summary: "Adjacent market expansion with unmet demand signals",
    valueHypothesis: "Entering an adjacent segment can increase revenue without diluting core brand",
    nextStep: "Queue for Pillow review of market readiness and compliance constraints",
    base: { relevanceScore: 78, profitPotentialScore: 82, feasibilityScore: 64, confidenceScore: 70, riskScore: 48 },
  },
  {
    domain: "product_innovation",
    category: "business",
    signal: "structural://product_whitespace",
    summary: "Product capability gap that customers repeatedly signal",
    valueHypothesis: "A focused product increment can unlock higher willingness-to-pay",
    nextStep: "Queue for Pillow review of product feasibility and capital needs",
    base: { relevanceScore: 74, profitPotentialScore: 76, feasibilityScore: 68, confidenceScore: 66, riskScore: 42 },
  },
  {
    domain: "revenue_growth",
    category: "business",
    signal: "structural://monetization_signal",
    summary: "Pricing or packaging uplift opportunity across existing demand",
    valueHypothesis: "Improved packaging can raise average revenue per account",
    nextStep: "Queue for Pillow review of pricing experiment scope",
    base: { relevanceScore: 80, profitPotentialScore: 84, feasibilityScore: 72, confidenceScore: 68, riskScore: 40 },
  },
  {
    domain: "cost_efficiency",
    category: "operational",
    signal: "structural://cost_friction",
    summary: "Operational cost leak detectable in repeated process waste",
    valueHypothesis: "Removing waste can improve margin without cutting quality",
    nextStep: "Queue for Pillow review of operational redesign options",
    base: { relevanceScore: 72, profitPotentialScore: 70, feasibilityScore: 78, confidenceScore: 74, riskScore: 35 },
  },
  {
    domain: "process_automation",
    category: "operational",
    signal: "structural://manual_bottleneck",
    summary: "High-frequency manual workflow suitable for automation",
    valueHypothesis: "Automation can reduce cycle time and error rates",
    nextStep: "Queue for Pillow review of automation candidate ranking",
    base: { relevanceScore: 76, profitPotentialScore: 68, feasibilityScore: 70, confidenceScore: 72, riskScore: 38 },
  },
  {
    domain: "customer_retention",
    category: "business",
    signal: "structural://churn_signal",
    summary: "Retention improvement opportunity in at-risk customer cohorts",
    valueHypothesis: "Lower churn preserves lifetime value more cheaply than acquisition",
    nextStep: "Queue for Pillow review of retention intervention options",
    base: { relevanceScore: 77, profitPotentialScore: 79, feasibilityScore: 71, confidenceScore: 69, riskScore: 36 },
  },
  {
    domain: "supply_chain",
    category: "operational",
    signal: "structural://supply_latency",
    summary: "Supply latency and buffer inefficiency across fulfillment nodes",
    valueHypothesis: "Improved routing can cut lead time and inventory carrying cost",
    nextStep: "Queue for Pillow review of logistics redesign candidates",
    base: { relevanceScore: 69, profitPotentialScore: 66, feasibilityScore: 62, confidenceScore: 63, riskScore: 52 },
  },
  {
    domain: "talent_leverage",
    category: "operational",
    signal: "structural://capacity_gap",
    summary: "Skill or capacity mismatch reducing throughput",
    valueHypothesis: "Better talent allocation can raise output without headcount spikes",
    nextStep: "Queue for Pillow review of workforce category needs (no assignment)",
    base: { relevanceScore: 71, profitPotentialScore: 60, feasibilityScore: 65, confidenceScore: 64, riskScore: 44 },
  },
  {
    domain: "compliance_optimization",
    category: "operational",
    signal: "structural://compliance_overhead",
    summary: "Compliance process overhead that can be standardized safely",
    valueHypothesis: "Standardized controls reduce cost while preserving governance",
    nextStep: "Queue for Pillow review of compliance streamlining under governance",
    base: { relevanceScore: 73, profitPotentialScore: 55, feasibilityScore: 67, confidenceScore: 71, riskScore: 46 },
  },
  {
    domain: "capital_allocation",
    category: "business",
    signal: "structural://capital_idle",
    summary: "Idle or underperforming capital that can be reallocated",
    valueHypothesis: "Reallocation toward higher-yield opportunities improves portfolio return",
    nextStep: "Queue for Pillow review of capital reallocation hypotheses",
    base: { relevanceScore: 75, profitPotentialScore: 81, feasibilityScore: 58, confidenceScore: 61, riskScore: 55 },
  },
];

export class OpportunityDiscoveryEngine {
  discover(domains: string[], categoryFocus: OpportunityCategory | "all", signalHints: string[] = []) {
    const normalizedDomains = domains.map((d) => d.trim().toLowerCase()).filter(Boolean);
    const hints = signalHints.map((h) => h.toLowerCase());
    return DOMAIN_BLUEPRINTS.filter((bp) => {
      if (!normalizedDomains.includes(bp.domain)) return false;
      if (categoryFocus !== "all" && bp.category !== categoryFocus) return false;
      return true;
    }).map((bp) => {
      const hintBoost = hints.some((h) => bp.domain.includes(h) || bp.summary.toLowerCase().includes(h) || bp.signal.includes(h));
      return { ...bp, hintBoost };
    });
  }
}

export class OpportunityScoringEngine {
  score(
    base: OpportunityScores,
    options: { hintBoost?: boolean; minConfidence: number },
  ): OpportunityScores {
    const boost = options.hintBoost ? 6 : 0;
    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
    const confidenceScore = clamp(base.confidenceScore + boost);
    return {
      relevanceScore: clamp(base.relevanceScore + (options.hintBoost ? 4 : 0)),
      profitPotentialScore: clamp(base.profitPotentialScore + (options.hintBoost ? 3 : 0)),
      feasibilityScore: clamp(base.feasibilityScore),
      confidenceScore,
      riskScore: clamp(base.riskScore - (options.hintBoost ? 2 : 0)),
    };
  }
}

export class OpportunityNormalizer {
  normalizeSummary(summary: string, domain: string, category: OpportunityCategory): string {
    return `[${category}/${domain}] ${summary.trim()}`;
  }
}
