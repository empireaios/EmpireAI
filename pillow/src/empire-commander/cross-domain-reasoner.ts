import type { EmpireCommanderDeps, CrossDomainSynthesis, DomainSignal } from "./types.js";

export function synthesizeCrossDomain(deps: EmpireCommanderDeps): CrossDomainSynthesis {
  const signals: DomainSignal[] = [
    buildEngineeringSignal(deps),
    buildInfrastructureSignal(deps),
    buildCommerceSignal(deps),
    buildUxSignal(deps),
    buildBusinessSignal(deps),
    buildOperationsSignal(deps),
    buildFinancialSignal(deps),
    buildCustomerSignal(deps),
  ];

  const overallHealthScore = Math.round(
    signals.reduce((sum, s) => sum + s.healthScore, 0) / signals.length,
  );

  const connectedInsights = deriveConnectedInsights(signals, deps);
  const systemicRisks = deriveSystemicRisks(signals);

  return { overallHealthScore, domainSignals: signals, connectedInsights, systemicRisks };
}

function buildEngineeringSignal(deps: EmpireCommanderDeps): DomainSignal {
  const health = deps.intelligence.health.score;
  const issueCount = deps.intelligence.health.issues.length;
  return {
    domain: "engineering",
    healthScore: Math.max(0, Math.min(100, health)),
    summary: `Repository health ${health}/100 with ${issueCount} tracked issue(s)`,
    risks: issueCount > 3 ? ["Multiple engineering debt signals require Technical Chief review"] : [],
    opportunities: health >= 80
      ? ["Engineering foundation stable — safe to expand commerce and UX missions"]
      : ["Prioritize Technical Chief certification before major feature work"],
  };
}

function buildInfrastructureSignal(deps: EmpireCommanderDeps): DomainSignal {
  const snapshot = deps.infrastructureCommander.getLastSnapshot();
  const healthMap: Record<string, number> = {
    healthy: 95,
    degraded: 65,
    critical: 25,
    unknown: 50,
  };
  const score = snapshot ? healthMap[snapshot.overallHealth] ?? 50 : 70;
  return {
    domain: "infrastructure",
    healthScore: score,
    summary: snapshot
      ? `Infrastructure ${snapshot.overallHealth} — readiness ${snapshot.productionReadiness}`
      : "Infrastructure Commander ready — run scan for live platform state",
    risks: snapshot?.overallHealth === "critical"
      ? ["Production platform requires immediate Infrastructure Commander recovery"]
      : [],
    opportunities: snapshot?.overallHealth === "healthy"
      ? ["Platforms healthy — commerce launch infrastructure available"]
      : ["Schedule infrastructure scan before production commerce deployment"],
  };
}

function buildCommerceSignal(deps: EmpireCommanderDeps): DomainSignal {
  const report = deps.commerceIntelligence.analyzeCommerce();
  const winnerCount = report.recommendedProducts.length;
  const score = Math.min(100, 50 + winnerCount * 12);
  return {
    domain: "commerce",
    healthScore: score,
    summary: `${winnerCount} winning product(s) above quality threshold`,
    risks: report.competitorThreats.some((c) => c.threatLevel === "high")
      ? ["High-threat competitor requires differentiated positioning"]
      : [],
    opportunities: report.recommendedActions.slice(0, 2),
  };
}

function buildUxSignal(deps: EmpireCommanderDeps): DomainSignal {
  const state = deps.uxDesigner.getState();
  return {
    domain: "ux",
    healthScore: state.status === "ready" ? 85 : 55,
    summary: `UX Designer ${state.designerVersion} — ${state.indexedScreens} screens catalogued`,
    risks: [],
    opportunities: ["Natural-language UX changes available via Cursor Bridge pipeline"],
  };
}

function buildBusinessSignal(deps: EmpireCommanderDeps): DomainSignal {
  const journey = deps.bootstrap.journeyPosition ?? "unknown";
  const mission = deps.bootstrap.currentMission ?? "none";
  const objectiveTitle = deps.objective?.getActiveObjective().title ?? "Empire objective active";
  return {
    domain: "business",
    healthScore: journey.includes("Phase") || mission ? 78 : 65,
    summary: `Journey: ${journey} · Mission: ${mission} · ${objectiveTitle}`,
    risks: [],
    opportunities: ["Align next commerce launch with active objective"],
  };
}

function buildOperationsSignal(deps: EmpireCommanderDeps): DomainSignal {
  const awareness = deps.orchestrator?.getRuntimeAwareness();
  const readyCount = awareness
    ? Object.values(awareness.subsystemHealth).filter((h) => h === "ready").length
    : 0;
  const total = awareness ? Object.keys(awareness.subsystemHealth).length : 1;
  const score = Math.round((readyCount / Math.max(total, 1)) * 100);
  return {
    domain: "operations",
    healthScore: score || 75,
    summary: awareness
      ? `${readyCount}/${total} subsystems ready · recovery ${awareness.recoveryStatus}`
      : "Orchestrator coordinating Pillow subsystems",
    risks: awareness?.recoveryStatus === "active" ? ["Recovery in progress — defer non-critical work"] : [],
    opportunities: ["Multi-engine orchestration prevents duplicated Cursor missions"],
  };
}

function buildFinancialSignal(deps: EmpireCommanderDeps): DomainSignal {
  const report = deps.commerceIntelligence.analyzeCommerce();
  const topMargin = report.recommendedProducts[0]?.product.profitMarginPercent ?? 0;
  const score = Math.min(100, 40 + topMargin);
  return {
    domain: "financial",
    healthScore: score,
    summary: topMargin
      ? `Top product margin ${topMargin}% — commerce revenue path identified`
      : "Commerce intelligence evaluating profit levers",
    risks: topMargin < 50 ? ["Margin pressure on recommended products"] : [],
    opportunities: ["Launch highest-margin winning product first"],
  };
}

function buildCustomerSignal(deps: EmpireCommanderDeps): DomainSignal {
  const report = deps.commerceIntelligence.analyzeCommerce();
  const topInterest = report.recommendedProducts[0]?.product.customerInterest ?? 70;
  return {
    domain: "customer",
    healthScore: topInterest,
    summary: `Peak customer interest ${topInterest}/100 on recommended catalogue`,
    risks: [],
    opportunities: ["Target advertising on highest customer-interest products"],
  };
}

function deriveConnectedInsights(signals: DomainSignal[], deps: EmpireCommanderDeps): string[] {
  const insights: string[] = [];
  const eng = signals.find((s) => s.domain === "engineering")!;
  const infra = signals.find((s) => s.domain === "infrastructure")!;
  const commerce = signals.find((s) => s.domain === "commerce")!;

  if (eng.healthScore >= 75 && infra.healthScore >= 75 && commerce.healthScore >= 70) {
    insights.push("Engineering, infrastructure, and commerce aligned — Empire ready for launch cycle");
  }
  if (infra.healthScore < 60 && commerce.healthScore >= 70) {
    insights.push("Commerce opportunities exist but infrastructure must stabilise before launch");
  }
  if (deps.bootstrap.currentMission) {
    insights.push(`Active mission ${deps.bootstrap.currentMission} should drive engine priority ordering`);
  }
  insights.push("EmpireAI operates as one connected system — cross-domain trade-offs evaluated centrally");
  return insights;
}

function deriveSystemicRisks(signals: DomainSignal[]): string[] {
  const risks: string[] = [];
  const lowDomains = signals.filter((s) => s.healthScore < 60);
  if (lowDomains.length >= 2) {
    risks.push(`Multi-domain weakness: ${lowDomains.map((d) => d.domain).join(", ")}`);
  }
  for (const signal of signals) {
    risks.push(...signal.risks);
  }
  return [...new Set(risks)].slice(0, 5);
}
