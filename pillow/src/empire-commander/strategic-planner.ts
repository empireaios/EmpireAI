import type { CrossDomainSynthesis, EmpireCommanderDeps, StrategicPlan } from "./types.js";

export function buildStrategicPlan(
  deps: EmpireCommanderDeps,
  crossDomain: CrossDomainSynthesis,
): StrategicPlan {
  const commerce = deps.commerceIntelligence.analyzeCommerce();
  const topProduct = commerce.recommendedProducts[0]?.product.name ?? "validated product";
  const journey = deps.bootstrap.journeyPosition ?? "current phase";
  const objective = deps.objective?.getActiveObjective().title ?? "Empire objective";

  const roadmapItems = [
    `Complete ${journey} objectives aligned to ${objective}`,
    "Stabilise infrastructure to production-ready state",
    `Launch ${topProduct} as first commerce revenue stream`,
    "Integrate live CJ API feed into Commerce Intelligence",
    "Expand Empire Commander cross-domain automation",
  ];

  const executionPlan = [
    "1. Infrastructure Commander scan and recovery if needed",
    "2. Technical Chief certify engineering blockers",
    "3. Commerce Intelligence validate winning product and supplier",
    "4. UX Designer + Cursor Bridge prepare storefront experience",
    "5. Mission Planner generate Cursor launch mission",
    "6. CRIR certification before live storefront",
  ];

  const growthInitiatives = [
    "Expand to priority market from Commerce Intelligence (SG/SEA hub)",
    "Add second winning product after first launch proves unit economics",
    "Automate supplier monitoring via backend G3-03 pipeline",
  ];

  const technologyEvolution = [
    "Wire Empire Commander to cockpit executive dashboard",
    "Live CJ/commerce API integration (Phase 9)",
    "Scheduled cross-domain executive scans",
    "@cursor/sdk autonomous dispatch from Cursor Bridge",
  ];

  const commerceExpansion = commerce.recommendedActions.slice(0, 3);

  const operationalPriorities = crossDomain.domainSignals
    .filter((s) => s.healthScore < 75)
    .map((s) => `Improve ${s.domain} domain (${s.healthScore}/100)`);

  if (operationalPriorities.length === 0) {
    operationalPriorities.push("Maintain current operational excellence across all domains");
  }

  return {
    horizon: "90d",
    roadmapItems,
    executionPlan,
    growthInitiatives,
    technologyEvolution,
    commerceExpansion,
    operationalPriorities,
  };
}
