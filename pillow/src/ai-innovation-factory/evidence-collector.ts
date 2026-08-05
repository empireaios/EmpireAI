import { existsSync } from "node:fs";

import { join } from "node:path";

import { nextInnovationId } from "./audit-store.js";

import type { AiInnovationFactoryDependencies } from "./integrations.js";

import { RESEARCH_CATALOG } from "./paths.js";

import type {

  ArchitectureRecommendationSummary,

  BusinessOpportunitySummary,

  CostOptimisationSummary,

  GkQ1201Observation,

  InnovationProposal,

  OperationalImprovementSummary,

  PriorityLevel,

  PriorityRanking,

  Q1201ContractConsumption,

  RiskSummary,

  SeriesCompletePrerequisite,

  TechnologyResearchSummary,

  ModelApiTrackingSummary,

} from "./types.js";



const COST_WEIGHT: Record<string, number> = { low: 1, medium: 2, high: 3 };

const RISK_WEIGHT: Record<string, number> = { low: 1, medium: 2, high: 3 };



export function verifySeriesCompletePrerequisite(

  q1201: Q1201ContractConsumption,

): SeriesCompletePrerequisite {

  const outstanding: string[] = [];

  if (!q1201.consumed) {

    outstanding.push("Q1201 consumable contract not consumed from qSeriesCompletion");

  }

  if (q1201.finalCompletionDecision !== "complete") {

    outstanding.push(

      `Q Series not complete — finalCompletionDecision=${q1201.finalCompletionDecision ?? "unknown"}`,

    );

  }

  const seriesCompleteActivation =

    q1201.consumed && q1201.finalCompletionDecision === "complete" && q1201.seriesCompletePrerequisite;

  return {

    verified: q1201.attempted,

    seriesCompleteActivation,

    q1201Consumed: q1201.consumed,

    finalCompletionDecision: q1201.finalCompletionDecision,

    outstandingPrerequisiteIssues: outstanding,

    evidence: [

      q1201.evidence,

      `seriesCompleteActivation=${seriesCompleteActivation}`,

      ...outstanding.map((i) => `prerequisite:${i}`),

    ],

  };

}



export function researchEmergingTechnologies(

  deps: AiInnovationFactoryDependencies,

  repositoryRoot: string,

  catalogPaths: string[],

): TechnologyResearchSummary {

  const now = new Date().toISOString();

  const injectedEvidenceCount = catalogPaths.filter((p) =>

    existsSync(join(repositoryRoot, p)),

  ).length;

  const runtimeGapSignals = collectRuntimeGapSignals(deps).length;



  const entries = RESEARCH_CATALOG.map((entry) => ({

    catalogId: entry.catalogId,

    category: entry.category,

    name: entry.name,

    evidenceRef: entry.evidenceRef,

  }));



  return {

    computedAt: now,

    catalogEntries: RESEARCH_CATALOG.length,

    injectedEvidenceCount,

    runtimeGapSignals,

    entries,

    evidence: [

      `research_catalog_entries=${RESEARCH_CATALOG.length}`,

      `injected_evidence_paths=${injectedEvidenceCount}/${catalogPaths.length}`,

      `runtime_gap_signals=${runtimeGapSignals}`,

      "catalog_based_only — no external web claims fabricated",

    ],

  };

}



export function trackModelsAndApis(): ModelApiTrackingSummary {

  const now = new Date().toISOString();

  const modelEntries = RESEARCH_CATALOG.filter((e) => e.category === "ai_model" || e.category === "framework");

  const apiEntries = RESEARCH_CATALOG.filter((e) => e.category === "api");



  return {

    computedAt: now,

    trackedModels: modelEntries.map((e) => ({

      catalogId: e.catalogId,

      name: e.name,

      category: e.category,

      evidenceRef: e.evidenceRef,

    })),

    trackedApis: apiEntries.map((e) => ({

      catalogId: e.catalogId,

      name: e.name,

      evidenceRef: e.evidenceRef,

    })),

    evidence: [

      `tracked_models=${modelEntries.length}`,

      `tracked_apis=${apiEntries.length}`,

      "structural catalog entries with evidence refs only",

    ],

  };

}



export function discoverBusinessOpportunities(deps: AiInnovationFactoryDependencies): BusinessOpportunitySummary {

  const now = new Date().toISOString();

  const opportunities: BusinessOpportunitySummary["opportunities"] = [];



  const factories = deps.sharedRuntimeCore?.listFactories?.() ?? [];

  for (const factory of factories.slice(0, 5)) {

    const factoryKey = String(factory.factoryKey ?? factory.id ?? "unknown");

    opportunities.push({

      opportunity: `Expand ${factoryKey} capability surface`,

      factoryKey,

      evidence: `sharedRuntimeCore.listFactories factoryKey=${factoryKey}`,

    });

  }



  const catalogOpps = RESEARCH_CATALOG.filter((e) => e.category === "business_opportunity");

  for (const entry of catalogOpps) {

    opportunities.push({

      opportunity: entry.name,

      evidence: `research_catalog:${entry.catalogId} ref=${entry.evidenceRef}`,

    });

  }



  const topology = deps.pillowOrchestrationRuntime?.getTopology?.() as

    | { workflows?: Array<{ id?: string }> }

    | undefined;

  for (const wf of topology?.workflows?.slice(0, 3) ?? []) {

    opportunities.push({

      opportunity: `Orchestration workflow optimisation: ${wf.id ?? "unknown"}`,

      evidence: `pillowOrchestrationRuntime.getTopology workflow=${wf.id ?? "unknown"}`,

    });

  }



  return {

    computedAt: now,

    opportunities,

    evidence: [

      `factory_opportunities=${factories.length}`,

      `catalog_opportunities=${catalogOpps.length}`,

      `topology_workflows=${topology?.workflows?.length ?? 0}`,

    ],

  };

}



export function evaluateArchitecturalImprovements(

  deps: AiInnovationFactoryDependencies,

): ArchitectureRecommendationSummary {

  const now = new Date().toISOString();

  const recommendations: ArchitectureRecommendationSummary["recommendations"] = [];

  const gaps = collectRuntimeGapSignals(deps);



  for (const gap of gaps) {

    recommendations.push({

      gap: gap.signal,

      recommendation: `Remediate ${gap.signal} via shared runtime / orchestration binding review`,

      evidence: gap.evidence,

    });

  }



  const archCatalog = RESEARCH_CATALOG.filter((e) => e.category === "architecture");

  for (const entry of archCatalog) {

    recommendations.push({

      gap: entry.description,

      recommendation: entry.expectedBenefit,

      evidence: `research_catalog:${entry.catalogId} ref=${entry.evidenceRef}`,

    });

  }



  return {

    computedAt: now,

    recommendations,

    evidence: [

      `runtime_gaps=${gaps.length}`,

      `architecture_catalog=${archCatalog.length}`,

      "SRTC/POR health gaps from injected evidence only",

    ],

  };

}



export function analyseOperationalImprovements(

  deps: AiInnovationFactoryDependencies,

): OperationalImprovementSummary {

  const now = new Date().toISOString();

  const improvements: OperationalImprovementSummary["improvements"] = [];

  const monitoringState = deps.monitoringRuntime?.getState?.() as { status?: string } | undefined;

  const auditState = deps.auditRuntime?.getState?.() as { status?: string } | undefined;



  if (monitoringState?.status && monitoringState.status !== "active") {

    improvements.push({

      signal: `monitoringRuntime.status=${monitoringState.status}`,

      recommendation: "Restore monitoring runtime to active for operational visibility",

      evidence: "monitoringRuntime.getState injected signal",

    });

  }



  if (auditState?.status && auditState.status !== "active") {

    improvements.push({

      signal: `auditRuntime.status=${auditState.status}`,

      recommendation: "Restore audit runtime to active for compliance traceability",

      evidence: "auditRuntime.getState injected signal",

    });

  }



  const workers = deps.workerRegistry?.listWorkers?.() ?? deps.workerRegistry?.getWorkers?.() ?? [];

  const failedWorkers = workers.filter((w) => w.status === "failed" || w.status === "degraded");

  for (const worker of failedWorkers.slice(0, 3)) {

    improvements.push({

      signal: `worker ${String(worker.workerId ?? "unknown")} status=${String(worker.status)}`,

      recommendation: "Investigate worker health and restore operational status",

      evidence: "workerRegistry injected signal",

    });

  }



  const opsCatalog = RESEARCH_CATALOG.filter((e) => e.category === "operations");

  for (const entry of opsCatalog) {

    improvements.push({

      signal: entry.name,

      recommendation: entry.description,

      evidence: `research_catalog:${entry.catalogId} ref=${entry.evidenceRef}`,

    });

  }



  return {

    computedAt: now,

    improvements,

    evidence: [

      `monitoring_status=${monitoringState?.status ?? "unknown"}`,

      `audit_status=${auditState?.status ?? "unknown"}`,

      `failed_workers=${failedWorkers.length}`,

    ],

  };

}



export function buildCostOptimisationSummary(): CostOptimisationSummary {

  const now = new Date().toISOString();

  const costEntries = RESEARCH_CATALOG.filter((e) => e.category === "cost_optimisation");

  return {

    computedAt: now,

    proposals: costEntries.map((e) => ({

      area: e.name,

      expectedSaving: e.expectedBenefit,

      evidence: `research_catalog:${e.catalogId} ref=${e.evidenceRef}`,

    })),

    evidence: [`cost_optimisation_entries=${costEntries.length}`],

  };

}



export function buildRiskSummary(proposals: InnovationProposal[]): RiskSummary {

  const now = new Date().toISOString();

  const risks = proposals.map((p) => ({

    risk: `${p.opportunity}: ${p.estimatedRisk} risk`,

    level: p.estimatedRisk,

    mitigation: `Governed recommendation only — approvalStatus=${p.approvalStatus}; never auto-deploy`,

  }));

  return {

    computedAt: now,

    risks,

    evidence: [`proposal_risks=${risks.length}`, "neverAutoDeployInnovations enforced"],

  };

}



export function buildInnovationProposals(

  technologySummary: TechnologyResearchSummary,

  businessSummary: BusinessOpportunitySummary,

  architectureSummary: ArchitectureRecommendationSummary,

  operationalSummary: OperationalImprovementSummary,

  costSummary: CostOptimisationSummary,

  grandKingApproved: boolean,

): InnovationProposal[] {

  const now = new Date().toISOString();

  const proposals: InnovationProposal[] = [];



  for (const entry of RESEARCH_CATALOG) {

    proposals.push(buildProposalFromCatalog(entry, now, grandKingApproved));

  }



  for (const opp of businessSummary.opportunities.slice(0, 3)) {

    proposals.push({

      innovationId: nextInnovationId(),

      category: "business_opportunity",

      opportunity: opp.opportunity,

      description: `Business opportunity from injected topology evidence`,

      expectedBenefit: "Potential revenue or efficiency gain from existing infrastructure",

      estimatedCost: "medium",

      estimatedRisk: "medium",

      priority: "medium",

      recommendation: "Evaluate feasibility via governed Pillow approval workflow — do not auto-deploy",

      approvalStatus: grandKingApproved ? "approved" : "pending",

      supportingEvidence: [opp.evidence],

      auditReference: `aifrt-audit-${nextInnovationId()}`,

      timestamp: now,

    });

  }



  for (const rec of architectureSummary.recommendations.slice(0, 2)) {

    proposals.push({

      innovationId: nextInnovationId(),

      category: "architecture",

      opportunity: rec.gap,

      description: rec.recommendation,

      expectedBenefit: "Improved architectural health",

      estimatedCost: "high",

      estimatedRisk: "medium",

      priority: "high",

      recommendation: "Schedule architectural review — recommendation only, never auto-deploy",

      approvalStatus: "pending",

      supportingEvidence: [rec.evidence],

      auditReference: `aifrt-audit-${nextInnovationId()}`,

      timestamp: now,

    });

  }



  for (const imp of operationalSummary.improvements.slice(0, 2)) {

    proposals.push({

      innovationId: nextInnovationId(),

      category: "operations",

      opportunity: imp.signal,

      description: imp.recommendation,

      expectedBenefit: "Operational stability improvement",

      estimatedCost: "low",

      estimatedRisk: "low",

      priority: "medium",

      recommendation: "Implement after Pillow/GK approval — never auto-deploy",

      approvalStatus: "pending",

      supportingEvidence: [imp.evidence],

      auditReference: `aifrt-audit-${nextInnovationId()}`,

      timestamp: now,

    });

  }



  void technologySummary;

  void costSummary;

  return proposals;

}



function buildProposalFromCatalog(

  entry: (typeof RESEARCH_CATALOG)[number],

  timestamp: string,

  grandKingApproved: boolean,

): InnovationProposal {

  const priority = scoreToPriority(

    computePriorityScore(entry.expectedBenefit, entry.estimatedCost, entry.estimatedRisk),

  );

  return {

    innovationId: nextInnovationId(),

    category: entry.category,

    opportunity: entry.name,

    description: entry.description,

    expectedBenefit: entry.expectedBenefit,

    estimatedCost: entry.estimatedCost,

    estimatedRisk: entry.estimatedRisk,

    priority,

    recommendation: `Governed recommendation for ${entry.name} — pending Pillow/GK approval; never auto-deploy`,

    approvalStatus: grandKingApproved ? "approved" : "pending",

    supportingEvidence: [`research_catalog:${entry.catalogId}`, `evidenceRef=${entry.evidenceRef}`],

    auditReference: `aifrt-audit-${entry.catalogId}`,

    timestamp,

  };

}



export function prioritiseInnovationProposals(proposals: InnovationProposal[]): PriorityRanking {

  const now = new Date().toISOString();

  const scored = proposals.map((p) => ({

    innovationId: p.innovationId,

    priority: p.priority,

    score: computePriorityScore(p.expectedBenefit, p.estimatedCost, p.estimatedRisk),

  }));

  scored.sort((a, b) => b.score - a.score || a.innovationId.localeCompare(b.innovationId));

  return {

    computedAt: now,

    ranking: scored.map((s) => ({

      innovationId: s.innovationId,

      priority: s.priority,

      score: s.score,

    })),

    evidence: ["deterministic scoring: benefit/cost/risk", `proposals_ranked=${scored.length}`],

  };

}



export function generateImplementationRecommendations(proposals: InnovationProposal[]): InnovationProposal[] {

  return proposals.map((p) => ({

    ...p,

    recommendation:

      p.approvalStatus === "approved"

        ? `${p.recommendation} [GK approved — record only, never auto-deploy]`

        : `${p.recommendation} [await Pillow/GK approval]`,

    supportingEvidence: [...p.supportingEvidence, "neverAutoDeployInnovations=true"],

  }));

}



export function buildOutstandingIssues(

  prerequisite: SeriesCompletePrerequisite,

  gkObservation: GkQ1201Observation,

): string[] {

  const issues = [...prerequisite.outstandingPrerequisiteIssues];

  if (!prerequisite.seriesCompleteActivation) {

    issues.push("seriesCompleteActivation=false — Q Series completion gate not satisfied");

  }

  if (gkObservation.observed && gkObservation.grandKingDecision !== "approve") {

    issues.push(`GKAGT grandKingDecision=${gkObservation.grandKingDecision ?? "unknown"} — governance context only`);

  }

  return issues;

}



export function computeConfidenceScore(

  prerequisite: SeriesCompletePrerequisite,

  proposalCount: number,

  validationDecision: "pass" | "partial" | "fail",

): number {

  if (validationDecision === "fail") return 0;

  let score = 0.4;

  if (prerequisite.q1201Consumed) score += 0.15;

  if (prerequisite.seriesCompleteActivation) score += 0.25;

  score += Math.min(0.2, proposalCount * 0.01);

  if (validationDecision === "partial") score *= 0.8;

  return Math.min(1, Math.round(score * 100) / 100);

}



function collectRuntimeGapSignals(deps: AiInnovationFactoryDependencies) {

  const gaps: Array<{ signal: string; evidence: string }> = [];

  const srtc = deps.sharedRuntimeCore?.getState?.() as { status?: string } | undefined;

  if (srtc?.status && srtc.status !== "active") {

    gaps.push({

      signal: `sharedRuntimeCore.status=${srtc.status}`,

      evidence: "sharedRuntimeCore.getState injected signal",

    });

  }

  const por = deps.pillowOrchestrationRuntime?.getState?.() as { status?: string } | undefined;

  if (por?.status && por.status !== "active") {

    gaps.push({

      signal: `pillowOrchestrationRuntime.status=${por.status}`,

      evidence: "pillowOrchestrationRuntime.getState injected signal",

    });

  }

  return gaps;

}



function computePriorityScore(benefit: string, cost: string, risk: string): number {

  const benefitScore = benefit.length > 40 ? 4 : benefit.length > 20 ? 3 : 2;

  const costPenalty = COST_WEIGHT[cost.toLowerCase()] ?? 2;

  const riskPenalty = RISK_WEIGHT[risk.toLowerCase()] ?? 2;

  return benefitScore * 10 - costPenalty * 3 - riskPenalty * 2;

}



function scoreToPriority(score: number): PriorityLevel {

  if (score >= 30) return "critical";

  if (score >= 22) return "high";

  if (score >= 14) return "medium";

  return "low";

}



export type { Q1201ContractConsumption, GkQ1201Observation };


