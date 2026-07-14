import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { DecisionSimulationEngine } from "../decision-simulation-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { OpportunityPrioritizationEngine } from "../opportunity-prioritization-engine/types.js";
import type { RiskAssessmentEngine } from "../risk-assessment-engine/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  RESOURCE_PIPELINE,
  RESOURCE_PRINCIPLES,
  GOVERNED_RESOURCE_DOMAINS,
  ALLOCATION_OPTIMIZATION_DIMENSIONS,
  RESOURCE_BALANCING_METRICS,
  PILLOW_RESOURCE_EVALUATIONS,
} from "./paths.js";
import type {
  ResourceAllocationEngine,
  ResourcePipelineStep,
  ResourcePipelinePhase,
  ResourceAllocation,
  CapacityMetric,
  ResourceBottleneck,
  AllocationOptimizationMetric,
  ResourceBalancingEntry,
  ResourceAllocationRecommendation,
  PillowResourceEvaluationMetric,
  GovernedResourceDomain,
  ResourceClassification,
} from "./types.js";

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function healthLabel(score: number): string {
  if (score >= 85) return "healthy";
  if (score >= 70) return "stable";
  if (score >= 50) return "attention";
  return "critical";
}

function buildPipeline(activePhase: ResourcePipelinePhase = "allocation_optimization"): ResourcePipelineStep[] {
  const activeIdx = RESOURCE_PIPELINE.indexOf(activePhase);
  return RESOURCE_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function mapDomain(classification: ResourceClassification): GovernedResourceDomain {
  const map: Record<ResourceClassification, GovernedResourceDomain> = {
    capital: "capital",
    financial: "budget",
    engineering: "engineering_capacity",
    infrastructure: "infrastructure",
    technology: "compute_resources",
    business: "business_investment",
    marketing: "marketing_investment",
    operations: "operational_resources",
    executive: "executive_attention",
    knowledge: "future_resource_classes",
    production: "operational_resources",
    automation: "automation_capacity",
  };
  return map[classification];
}

function buildAllocations(input: {
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
}): ResourceAllocation[] {
  const topRec = input.executiveRecommendationEngine?.priorityQueue[0];
  const topOpportunity = input.opportunityPrioritization?.highestPriorityOpportunities[0];
  const objectives =
    input.strategicObjectives?.currentStrategicObjectives.map((o) => o.title).slice(0, 2) ?? [
      "E2 Executive Decision Engine",
    ];
  const pendingDecisions =
    input.executiveDecisionArchitecture?.currentDecisions.filter(
      (d) => d.status === "pending" || d.status === "queued",
    ).length ?? 2;

  const catalogue: Array<{
    id: string;
    type: ResourceClassification;
    purpose: string;
    objective: string;
    owner: string;
    current: string;
    requested: string;
    approved: string;
    business: string;
    financial: string;
    engineering: string;
    roi: string;
    deps: string[];
    constraints: string[];
    confidence: number;
    evidence: string[];
    utilization: number;
    status: string;
  }> = [
    {
      id: "rae-ms-a-capital",
      type: "capital",
      purpose: "MS-A commerce investment toward USD 100k net profit",
      objective: objectives[0] ?? "MS-A Financial Milestone",
      owner: "Grand King",
      current: "35% allocated",
      requested: "50% increase phased",
      approved: "40% phased allocation",
      business: "critical",
      financial: "high ROI potential",
      engineering: "moderate",
      roi: "18-month target · 3.2x projected",
      deps: ["P8 Commerce", "Business Factory", "Grand King Account"],
      constraints: ["Phased investment only", "Weekly ROI review"],
      confidence: 72,
      evidence: ["MS-A decision", "Opportunity ROI", "E2-04 recommendation"],
      utilization: 78,
      status: "approved",
    },
    {
      id: "rae-engineering-e2",
      type: "engineering",
      purpose: "E2 Executive Decision Engine development capacity",
      objective: "E2 Executive Decision Engine",
      owner: "Technical Chief",
      current: "60% engineering capacity",
      requested: "75% for E2 completion",
      approved: "70% allocated",
      business: "high",
      financial: "foundation investment",
      engineering: "critical",
      roi: "constitutional decision capability",
      deps: ["E2-01 through E2-05", "Repository", "Pillow"],
      constraints: ["No competing systems", "Canonical architecture"],
      confidence: 90,
      evidence: ["E2 roadmap", "Executive architecture"],
      utilization: 85,
      status: "active",
    },
    {
      id: "rae-executive-attention",
      type: "executive",
      purpose: "Grand King executive attention for pending decisions",
      objective: "Executive Decision Velocity",
      owner: "Grand King",
      current: `${pendingDecisions} pending decisions`,
      requested: "Weekly executive review block",
      approved: "Priority queue review · top 3 decisions",
      business: "critical",
      financial: "decision velocity",
      engineering: "low",
      roi: "faster constitutional decisions",
      deps: ["E2-04 Recommendations", "Executive Calendar"],
      constraints: ["Limited executive bandwidth", "Priority-ranked only"],
      confidence: 88,
      evidence: [topRec?.title ?? "Top recommendation", "Priority queue"],
      utilization: 72,
      status: "active",
    },
    {
      id: "rae-compute-infra",
      type: "technology",
      purpose: "Compute and infrastructure for Pillow and production operations",
      objective: "Production Truth",
      owner: "Infrastructure",
      current: "55% compute utilization",
      requested: "70% headroom for scaling",
      approved: "65% allocated · auto-scale enabled",
      business: "high",
      financial: "moderate OpEx",
      engineering: "high",
      roi: "production reliability",
      deps: ["Railway", "Vercel", "Guardian"],
      constraints: ["Cost caps", "Production-first"],
      confidence: 85,
      evidence: ["Infrastructure monitor", "Scaling architecture"],
      utilization: 65,
      status: "active",
    },
    {
      id: "rae-marketing-commerce",
      type: "marketing",
      purpose: "Commerce marketing investment for MS-A acceleration",
      objective: "Commerce Growth",
      owner: "Commerce",
      current: "20% marketing budget",
      requested: "35% for MS-A campaign",
      approved: "28% phased marketing allocation",
      business: "high",
      financial: "moderate CAC",
      engineering: "low",
      roi: "customer acquisition · revenue growth",
      deps: ["P8 Commerce", "Commercial Intelligence"],
      constraints: ["ROI-gated spend", "Measured campaigns"],
      confidence: 68,
      evidence: ["Commerce operating model", "Commercial intelligence"],
      utilization: 55,
      status: "approved",
    },
    {
      id: "rae-automation-capacity",
      type: "automation",
      purpose: "Business automation capacity for zero-human operations",
      objective: "P7 Automation",
      owner: "Automation",
      current: "40% automation capacity",
      requested: "55% for commerce automation",
      approved: "48% allocated",
      business: "moderate",
      financial: "cost reduction",
      engineering: "high",
      roi: "operational efficiency · reduced manual work",
      deps: ["Business Automation", "Zero-Human Automation"],
      constraints: ["Production validation required", "Guardian monitoring"],
      confidence: 80,
      evidence: ["Automation dashboard", "Business factory"],
      utilization: 62,
      status: "active",
    },
    {
      id: "rae-priority-opportunity",
      type: "business",
      purpose: topOpportunity
        ? `Resource focus: ${topOpportunity.title}`
        : "Highest-priority strategic opportunity resources",
      objective: objectives[1] ?? "Strategic Growth",
      owner: "Executive",
      current: "25% business investment",
      requested: "40% reallocation to top opportunity",
      approved: "35% approved reallocation",
      business: "critical",
      financial: "high",
      engineering: "moderate",
      roi: topOpportunity?.expectedRoi ?? "high projected ROI",
      deps: topOpportunity?.dependencies ?? ["Opportunity Prioritization"],
      constraints: ["E1-12 ranking required", "Evidence-backed only"],
      confidence: topOpportunity?.confidence ?? 80,
      evidence: topOpportunity?.evidence ?? ["ROI ranking"],
      utilization: 70,
      status: "recommended",
    },
    {
      id: "rae-knowledge-evolution",
      type: "knowledge",
      purpose: "Knowledge evolution and governance documentation capacity",
      objective: "Constitutional Knowledge",
      owner: "Pillow",
      current: "30% knowledge capacity",
      requested: "40% for E2 governance docs",
      approved: "35% allocated",
      business: "high",
      financial: "foundation",
      engineering: "moderate",
      roi: "constitutional compliance · journey recording",
      deps: ["Knowledge Evolution", "Governance docs"],
      constraints: ["No competing architectures"],
      confidence: 92,
      evidence: ["E2 governance", "Journey integration"],
      utilization: 45,
      status: "active",
    },
    {
      id: "rae-production-ops",
      type: "production",
      purpose: "Production operations and Guardian monitoring resources",
      objective: "Production Truth",
      owner: "Supervisor",
      current: "50% operational capacity",
      requested: "60% for production hardening",
      approved: "55% allocated",
      business: "high",
      financial: "risk reduction",
      engineering: "high",
      roi: "zero production incidents",
      deps: ["Guardian", "Production Centre", "Supervisor"],
      constraints: ["Production-first doctrine"],
      confidence: 90,
      evidence: ["Guardian monitoring", "Production mode"],
      utilization: 58,
      status: "active",
    },
    {
      id: "rae-storage-data",
      type: "infrastructure",
      purpose: "Storage and data infrastructure for empire operations",
      objective: "Data Foundation",
      owner: "Infrastructure",
      current: "42% storage utilized",
      requested: "55% capacity reservation",
      approved: "50% allocated",
      business: "moderate",
      financial: "low OpEx",
      engineering: "moderate",
      roi: "data reliability · audit trails",
      deps: ["Repository", "Audit Logger", "Sessions"],
      constraints: ["Retention policies", "Cost optimization"],
      confidence: 86,
      evidence: ["Repository architecture", "Durable sessions"],
      utilization: 50,
      status: "active",
    },
  ];

  return catalogue.map((c) => ({
    allocationId: c.id,
    resourceType: c.type,
    domain: mapDomain(c.type),
    purpose: c.purpose,
    strategicObjective: c.objective,
    owner: c.owner,
    currentAllocation: c.current,
    requestedAllocation: c.requested,
    approvedAllocation: c.approved,
    businessValue: c.business,
    financialValue: c.financial,
    engineeringValue: c.engineering,
    expectedRoi: c.roi,
    dependencies: c.deps,
    constraints: c.constraints,
    confidence: c.confidence,
    evidence: c.evidence,
    utilization: c.utilization,
    status: c.status,
  }));
}

function buildCapacityMetrics(allocations: ResourceAllocation[]): CapacityMetric[] {
  const domainMap = new Map<GovernedResourceDomain, { available: number; allocated: number }>();

  for (const domain of GOVERNED_RESOURCE_DOMAINS) {
    domainMap.set(domain, { available: 100, allocated: 0 });
  }

  for (const a of allocations) {
    const entry = domainMap.get(a.domain);
    if (entry) {
      entry.allocated = Math.max(entry.allocated, a.utilization);
    }
  }

  return GOVERNED_RESOURCE_DOMAINS.filter((d) => {
    const e = domainMap.get(d);
    return e && e.allocated > 0;
  }).map((domain) => {
    const e = domainMap.get(domain)!;
    const utilization = Math.round((e.allocated / e.available) * 100);
    return {
      domain,
      label: label(domain),
      available: e.available,
      allocated: e.allocated,
      utilization,
      status: utilization >= 85 ? "overcommitted" : utilization >= 70 ? "high" : utilization >= 50 ? "balanced" : "available",
    };
  });
}

function buildBottlenecks(allocations: ResourceAllocation[]): ResourceBottleneck[] {
  const highUtil = allocations.filter((a) => a.utilization >= 75);
  const bottlenecks: ResourceBottleneck[] = highUtil.map((a, i) => ({
    order: i + 1,
    resourceType: a.resourceType,
    title: `${label(a.resourceType)} · ${a.purpose.slice(0, 50)}`,
    severity: a.utilization >= 85 ? "critical" : "high",
    impact: `${a.utilization}% utilization · ${a.businessValue} business value`,
    mitigation: a.constraints[0] ?? "Review allocation · rebalance capacity",
  }));

  if (bottlenecks.length === 0) {
    bottlenecks.push({
      order: 1,
      resourceType: "engineering",
      title: "Engineering capacity approaching threshold",
      severity: "medium",
      impact: "E2 programme delivery may slow without rebalancing",
      mitigation: "Defer non-critical engineering · prioritize E2-05 through E2-06",
    });
  }

  return bottlenecks.slice(0, 6);
}

function buildOptimization(allocations: ResourceAllocation[]): AllocationOptimizationMetric[] {
  const avgUtil = Math.round(allocations.reduce((s, a) => s + a.utilization, 0) / Math.max(allocations.length, 1));
  const avgConf = Math.round(allocations.reduce((s, a) => s + a.confidence, 0) / Math.max(allocations.length, 1));

  const values: Record<string, { score: number; status: string }> = {
    strategic_value: { score: 82, status: "optimized" },
    business_value: {
      score: avgConf,
      status: "evaluated",
    },
    financial_return: { score: 74, status: "projected" },
    expected_roi: { score: avgConf, status: "quantified" },
    capacity_utilization: { score: avgUtil, status: avgUtil >= 80 ? "high" : "balanced" },
    resource_efficiency: { score: Math.round(100 - Math.max(0, avgUtil - 60)), status: "monitored" },
    dependency_coverage: { score: 78, status: "mapped" },
    execution_readiness: { score: 80, status: "ready" },
    risk_reduction: { score: 72, status: "evaluated" },
    long_term_growth: { score: 68, status: "planned" },
  };

  return ALLOCATION_OPTIMIZATION_DIMENSIONS.map((dimension) => ({
    dimension,
    label: label(dimension),
    score: values[dimension]?.score ?? 65,
    status: values[dimension]?.status ?? "optimizing",
  }));
}

function buildBalancing(allocations: ResourceAllocation[], capacity: CapacityMetric[]): ResourceBalancingEntry[] {
  const avgUtil = Math.round(allocations.reduce((s, a) => s + a.utilization, 0) / Math.max(allocations.length, 1));
  const overcommitted = capacity.filter((c) => c.status === "overcommitted").length;
  const unused = capacity.filter((c) => c.utilization < 50).length;

  const values: Record<string, { value: string; status: string }> = {
    available_capacity: { value: `${capacity.length} resource domains tracked`, status: "inventoried" },
    allocated_capacity: { value: `${avgUtil}% average utilization`, status: "allocated" },
    unused_capacity: { value: `${unused} domains under 50% utilization`, status: "available" },
    overcommitted_capacity: { value: `${overcommitted} overcommitted domains`, status: overcommitted > 0 ? "attention" : "balanced" },
    critical_resource_shortages: {
      value: allocations.filter((a) => a.utilization >= 85).length > 0 ? "engineering · executive attention" : "none critical",
      status: "monitored",
    },
    resource_bottlenecks: {
      value: `${allocations.filter((a) => a.utilization >= 75).length} active bottlenecks`,
      status: "evaluated",
    },
    resource_waste: { value: "minimal · constitutional allocation only", status: "low" },
    resource_conflicts: { value: "0 unresolved conflicts", status: "resolved" },
  };

  return RESOURCE_BALANCING_METRICS.map((metric) => ({
    metric,
    label: label(metric),
    value: values[metric]?.value ?? "evaluating",
    status: values[metric]?.status ?? "active",
  }));
}

function buildRecommendations(input: {
  allocations: ResourceAllocation[];
  bottlenecks: ResourceBottleneck[];
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
}): ResourceAllocationRecommendation[] {
  const topBottleneck = input.bottlenecks[0];
  const topAlloc = [...input.allocations].sort((a, b) => b.utilization - a.utilization)[0];

  return [
    {
      id: "rae-rec-1",
      title: "Apply constitutional resource pipeline to all allocations",
      category: "allocation_framework",
      why: "No hidden resource usage · highest value first · executive transparency",
      what: "Vision → Priority → Inventory → Demand → Constraint → Optimization → Approval → Review",
      how: "E2-05 Resource Allocation Engine · VIE validation · Journey recording",
      confidencePercent: 94,
    },
    {
      id: "rae-rec-2",
      title: topBottleneck ? `Address bottleneck: ${topBottleneck.title}` : "Review resource bottlenecks",
      category: "bottleneck",
      why: `${topBottleneck?.severity ?? "medium"} severity · capacity constraint`,
      what: topBottleneck?.mitigation ?? "Rebalance capacity across domains",
      how: "ECC scheduling · Supervisor monitoring · executive approval",
      confidencePercent: 88,
    },
    {
      id: "rae-rec-3",
      title: "Align allocations with E2-04 executive recommendations",
      category: "recommendation_integration",
      why: "Resources follow evidence-backed executive recommendations",
      what: input.executiveRecommendationEngine
        ? `${input.executiveRecommendationEngine.highPriorityCount} high-priority recommendations inform allocation`
        : "Link recommendations to resource allocation",
      how: "E2-04 Executive Recommendations · executive_recommendation pipeline phase",
      confidencePercent: 90,
    },
    {
      id: "rae-rec-4",
      title: topAlloc ? `Optimize: ${topAlloc.purpose.slice(0, 60)}` : "Review highest-utilization allocation",
      category: "optimization",
      why: `${topAlloc?.utilization ?? 0}% utilization · ${topAlloc?.expectedRoi ?? "ROI evaluated"}`,
      what: topAlloc?.approvedAllocation ?? "Review and rebalance",
      how: "Continuous review · allocation optimization · capacity rebalancing",
      confidencePercent: topAlloc?.confidence ?? 85,
    },
    {
      id: "rae-rec-5",
      title: "Prepare E2-06 Conflict Resolution Engine integration",
      category: "e2_roadmap",
      why: "Resource conflicts require constitutional resolution before execution",
      what: "Extend allocation engine with conflict resolution for competing demands",
      how: "E2-06 mission · integrate with constraint analysis phase",
      confidencePercent: 86,
    },
  ];
}

function buildPillowEvaluations(input: {
  allocations: ResourceAllocation[];
  bottlenecks: ResourceBottleneck[];
  recommendations: ResourceAllocationRecommendation[];
  healthScore: number;
}): PillowResourceEvaluationMetric[] {
  const avgUtil = Math.round(
    input.allocations.reduce((s, a) => s + a.utilization, 0) / Math.max(input.allocations.length, 1),
  );
  const values: Record<string, { status: string; summary: string }> = {
    resource_efficiency: {
      status: input.healthScore >= 80 ? "strong" : "optimizing",
      summary: `${avgUtil}% average utilization · ${input.allocations.length} allocations tracked`,
    },
    investment_opportunities: {
      status: "active",
      summary: `${input.allocations.filter((a) => a.status === "recommended").length} investment opportunities identified`,
    },
    capacity_constraints: {
      status: input.bottlenecks.length >= 2 ? "elevated" : "managed",
      summary: `${input.bottlenecks.length} bottlenecks · capacity rebalancing active`,
    },
    allocation_quality: {
      status: "strong",
      summary: "Constitutional allocation · evidence-backed · no hidden usage",
    },
    resource_risks: {
      status: input.bottlenecks.some((b) => b.severity === "critical") ? "elevated" : "managed",
      summary: `${input.bottlenecks.filter((b) => b.severity === "critical" || b.severity === "high").length} capacity risks monitored`,
    },
    executive_recommendations: {
      status: input.recommendations.length >= 4 ? "strong" : "building",
      summary: `${input.recommendations.length} resource allocation recommendations`,
    },
  };

  return PILLOW_RESOURCE_EVALUATIONS.map((domain) => ({
    domain,
    label: label(domain),
    status: values[domain]?.status ?? "evaluating",
    summary: values[domain]?.summary ?? "Pillow resource evaluation active",
  }));
}

export function assembleResourceAllocationEngine(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  riskAssessmentEngine?: RiskAssessmentEngine | null;
  decisionSimulationEngine?: DecisionSimulationEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  opportunityPrioritization?: OpportunityPrioritizationEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  journey?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
}): ResourceAllocationEngine {
  const currentAllocations = buildAllocations(input);
  const capacityMetrics = buildCapacityMetrics(currentAllocations);
  const currentBottlenecks = buildBottlenecks(currentAllocations);
  const allocationOptimization = buildOptimization(currentAllocations);
  const resourceBalancing = buildBalancing(currentAllocations, capacityMetrics);
  const recommendedActions = buildRecommendations({
    allocations: currentAllocations,
    bottlenecks: currentBottlenecks,
    executiveRecommendationEngine: input.executiveRecommendationEngine,
  });

  const avgUtil = Math.round(
    currentAllocations.reduce((s, a) => s + a.utilization, 0) / Math.max(currentAllocations.length, 1),
  );

  const healthScore = Math.round(
    (currentAllocations.reduce((s, a) => s + a.confidence, 0) / Math.max(currentAllocations.length, 1) +
      (input.corporateVision?.healthScore ?? 80) +
      (input.executiveRecommendationEngine?.healthScore ?? 80) +
      (100 - Math.max(0, avgUtil - 70))) /
      4,
  );

  const pillowEvaluations = buildPillowEvaluations({
    allocations: currentAllocations,
    bottlenecks: currentBottlenecks,
    recommendations: recommendedActions,
    healthScore,
  });

  const pillowAdvisory = [
    `Engine health: ${healthScore}/100 (${healthLabel(healthScore)})`,
    `${currentAllocations.length} allocations · ${avgUtil}% average utilization · transparent`,
    `Vision alignment: ${String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned")}`,
    `${currentBottlenecks.length} bottlenecks · ${capacityMetrics.filter((c) => c.status === "overcommitted").length} overcommitted`,
    `No competing allocation systems · one constitutional resource authority`,
    `Ready for E2-06 Conflict Resolution Engine`,
  ];

  return {
    engineVersion: "E2-05",
    computedAt: new Date().toISOString(),
    engineSummary:
      "One permanent Resource Allocation Engine — constitutional executive system governing enterprise resource planning and allocation according to strategic value, expected ROI and constitutional priorities with complete executive visibility",
    engineHealth: `${healthScore}/100 · ${healthLabel(healthScore)}`,
    resourceHealth: avgUtil >= 85 ? "overcommitted" : avgUtil >= 70 ? "high utilization" : "balanced",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore,
    activeAllocationCount: currentAllocations.length,
    bottleneckCount: currentBottlenecks.length,
    currentAllocations,
    capacityMetrics,
    utilizationSummary: `${avgUtil}% average utilization across ${currentAllocations.length} allocations`,
    allocationOptimization,
    resourceBalancing,
    currentBottlenecks,
    resourcePipeline: buildPipeline("continuous_review"),
    recommendedActions,
    pillowEvaluations,
    resourcePrinciples: [...RESOURCE_PRINCIPLES],
    governedDomains: [...GOVERNED_RESOURCE_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      riskAssessmentEngine: input.riskAssessmentEngine
        ? `E2-02 · ${input.riskAssessmentEngine.engineHealth}`
        : "E2-02 · standby",
      decisionSimulationEngine: input.decisionSimulationEngine
        ? `E2-03 · ${input.decisionSimulationEngine.engineHealth}`
        : "E2-03 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.highPriorityCount} high priority`
        : "E2-04 · standby",
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified · planning context active"
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring resources"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "resource scheduling"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE206: true,
  };
}

export function buildFallbackResourceAllocationEngine(): ResourceAllocationEngine {
  return assembleResourceAllocationEngine({});
}
