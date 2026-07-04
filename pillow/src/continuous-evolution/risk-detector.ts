import type { ContinuousEvolutionDeps, DetectedRisk, RiskDetectionReport } from "./types.js";

export function detectRisks(deps: ContinuousEvolutionDeps): RiskDetectionReport {
  const risks: DetectedRisk[] = [];
  const health = deps.intelligence.health.score;
  const infra = deps.infrastructureCommander.getLastSnapshot();
  const commerce = deps.commerceIntelligence.analyzeCommerce();

  if (health < 50) {
    risks.push({
      category: "engineering",
      level: "critical",
      description: `Repository health critical at ${health}/100`,
      preventiveAction: "Halt new feature work — Technical Chief recovery mission",
    });
  } else if (health < 75) {
    risks.push({
      category: "engineering",
      level: "high",
      description: `Engineering debt elevated — health ${health}/100`,
      preventiveAction: "Schedule architecture improvement sprint",
    });
  }

  risks.push({
    category: "security",
    level: "medium",
    description: "Production credentials require periodic rotation verification",
    preventiveAction: "Run G8-04 connection health monitoring cycle",
  });

  if (infra?.overallHealth === "critical") {
    risks.push({
      category: "deployment",
      level: "critical",
      description: "Production platform in critical state",
      preventiveAction: "Infrastructure Commander recovery coordination",
    });
  } else if (!infra) {
    risks.push({
      category: "deployment",
      level: "medium",
      description: "No recent deployment health scan",
      preventiveAction: "Run Infrastructure Commander scan",
    });
  }

  const topMargin = commerce.recommendedProducts[0]?.product.profitMarginPercent ?? 0;
  if (topMargin < 50 && commerce.recommendedProducts.length > 0) {
    risks.push({
      category: "financial",
      level: "high",
      description: "Top product margin below Empire threshold",
      preventiveAction: "Review pricing and supplier costs before launch",
    });
  }

  const highThreats = commerce.competitorThreats.filter((c) => c.threatLevel === "high");
  if (highThreats.length > 0) {
    risks.push({
      category: "business",
      level: "high",
      description: `${highThreats.length} high-threat competitor(s) identified`,
      preventiveAction: "Differentiate on brand, reviews, and shipping speed",
    });
  }

  const subs = deps.orchestrator?.getSubsystems() ?? [];
  const unavailable = subs.filter((s) => s.health === "unavailable");
  if (unavailable.length > 0) {
    risks.push({
      category: "operational",
      level: "high",
      description: `${unavailable.length} Pillow subsystem(s) unavailable`,
      preventiveAction: "Verify session bootstrap chain and subsystem initialization",
    });
  }

  const levelWeight: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  const criticalCount = risks.filter((r) => r.level === "critical").length;
  const overallRiskScore = risks.length > 0
    ? Math.min(100, risks.reduce((s, r) => s + levelWeight[r.level]! * 10, 0))
    : 15;

  return { risks, criticalCount, overallRiskScore };
}
