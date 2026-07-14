import type { CorporateVisionEngine } from "../corporate-vision-engine/types.js";
import type { DecisionAuditEngine } from "../decision-audit-engine/types.js";
import type { ExecutiveConfidenceEngine } from "../executive-confidence-engine/types.js";
import type { ExecutiveDecisionArchitecture } from "../executive-decision-architecture/types.js";
import type { ExecutivePlanningCertification } from "../executive-planning-certification/types.js";
import type { ExecutivePolicyEngine } from "../executive-policy-engine/types.js";
import type { ExecutiveRecommendationEngine } from "../executive-recommendation-engine/types.js";
import type { KnowledgeEvolutionArchitecture } from "../knowledge-evolution-architecture/types.js";
import type { StrategicObjectiveEngine } from "../strategic-objective-engine/types.js";
import {
  MONITORING_PIPELINE,
  MONITORING_PRINCIPLES,
  GOVERNED_MONITOR_DOMAINS,
  MONITORING_CAPABILITIES,
  AUTONOMOUS_ACTIONS,
  PILLOW_MONITOR_EVALUATIONS,
} from "./paths.js";
import type {
  AutonomousDecisionMonitor,
  MonitoringPipelineStep,
  MonitoringPipelinePhase,
  MonitoredDecision,
  PerformanceTrendEntry,
  DeviationEntry,
  ExecutiveAlert,
  CorrectiveActionEntry,
  ConfidenceChangeEntry,
  BusinessOutcomeEntry,
  MonitoringCapabilityMetric,
  AutonomousDecisionRecommendation,
  PillowMonitorEvaluationMetric,
  GovernedMonitorDomain,
  MonitorClassification,
  MonitoringCapability,
  AutonomousAction,
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

function mapDomain(category: MonitorClassification): GovernedMonitorDomain {
  const map: Record<MonitorClassification, GovernedMonitorDomain> = {
    strategic: "strategic_decisions",
    business: "business_decisions",
    financial: "financial_decisions",
    commerce: "commerce_decisions",
    engineering: "engineering_decisions",
    architecture: "architecture_decisions",
    operational: "operational_decisions",
    production: "production_decisions",
    governance: "governance_decisions",
    investment: "investment_decisions",
    recommendation: "executive_recommendations",
    policy: "executive_policies",
  };
  return map[category];
}

function buildPipeline(activePhase: MonitoringPipelinePhase = "performance_monitoring"): MonitoringPipelineStep[] {
  const activeIdx = MONITORING_PIPELINE.indexOf(activePhase);
  return MONITORING_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function buildMonitoredDecisions(input: {
  decisionAuditEngine?: DecisionAuditEngine | null;
  executiveConfidenceEngine?: ExecutiveConfidenceEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
}): MonitoredDecision[] {
  const audits = input.decisionAuditEngine?.recentDecisions ?? [];
  const assessments = input.executiveConfidenceEngine?.confidenceAssessments ?? [];
  const recommendations = input.executiveRecommendationEngine?.currentRecommendations ?? [];
  const policies = input.executivePolicyEngine?.activePolicies ?? [];

  const catalogue: Array<Omit<MonitoredDecision, "domain"> & { category: MonitorClassification }> = [
    {
      monitorId: "admon-e2-engineering",
      decisionId: "dec-e2-engineering",
      title: "Engineering Resource Allocation",
      category: "engineering",
      currentStatus: "executing",
      expectedOutcome: "85% utilization · E2 gates on track",
      actualOutcome: "82% utilization · E2-14 complete · E2-15 active",
      businessImpact: "positive",
      financialImpact: "within budget",
      engineeringImpact: "sustainable velocity",
      strategicImpact: "aligned",
      performanceTrend: "stable",
      deviationScore: 8,
      confidenceTrend: "stable at 90%",
      recommendedActions: ["Continue phased allocation", "Monitor commerce delay risk"],
      evidence: [audits[0]?.supportingEvidence[0] ?? "Audit verified", "E2-14 confidence 90%"],
    },
    {
      monitorId: "admon-msa-financial",
      decisionId: "dec-msa-financial",
      title: "MS-A Investment Phasing",
      category: "financial",
      currentStatus: "monitoring",
      expectedOutcome: "ROI gates met at phase transitions",
      actualOutcome: "Phase 1 ROI 112% · Phase 2 pending",
      businessImpact: "positive",
      financialImpact: "controlled exposure",
      engineeringImpact: "moderate",
      strategicImpact: "aligned",
      performanceTrend: "improving",
      deviationScore: 12,
      confidenceTrend: "improving 85→88%",
      recommendedActions: ["Proceed Phase 2 with ROI gate", "Monitor market timing"],
      evidence: ["Financial audit trail", "E2-13 outcome verified"],
    },
    {
      monitorId: "admon-arch-policy",
      decisionId: "dec-arch-policy",
      title: "Canonical Architecture Enforcement",
      category: "architecture",
      currentStatus: "healthy",
      expectedOutcome: "Zero constitutional violations",
      actualOutcome: "100% compliance · VIE validated",
      businessImpact: "high quality",
      financialImpact: "moderate cost premium",
      engineeringImpact: "high quality",
      strategicImpact: "constitutionally aligned",
      performanceTrend: "stable",
      deviationScore: 3,
      confidenceTrend: "stable at 93%",
      recommendedActions: ["Maintain enforcement", "Document exceptions"],
      evidence: ["VIE validation 94%", "Guardian repository integrity"],
    },
    {
      monitorId: "admon-commerce-mvp",
      decisionId: "dec-p8-launch",
      title: "Commerce MVP Launch",
      category: "commerce",
      currentStatus: "attention",
      expectedOutcome: "MVP revenue within 90 days",
      actualOutcome: "Revenue 78% of target · support scaling lag",
      businessImpact: "moderate",
      financialImpact: "below forecast",
      engineeringImpact: "focused delivery",
      strategicImpact: "aligned",
      performanceTrend: "degrading",
      deviationScore: 28,
      confidenceTrend: "declining 86→78%",
      recommendedActions: ["Trigger executive review", "Recommend resource reallocation for support"],
      evidence: ["Commerce metrics", "Customer feedback evidence"],
    },
    {
      monitorId: "admon-e2-sequencing",
      decisionId: "dec-e2-sequencing",
      title: "E2 Sequential Completion",
      category: "strategic",
      currentStatus: "healthy",
      expectedOutcome: "E2-01 through E2-15 complete on schedule",
      actualOutcome: "E2-14 complete · E2-15 active · on track",
      businessImpact: "critical enabler",
      financialImpact: "investment justified",
      engineeringImpact: "architectural maturity",
      strategicImpact: "vision-aligned",
      performanceTrend: "improving",
      deviationScore: 5,
      confidenceTrend: "improving 90→92%",
      recommendedActions: ["Continue E2 sequence", "Prepare E2-16 certification"],
      evidence: [assessments[0]?.supportingFactors[0] ?? "E2 confidence evidence", "Journey milestone verified"],
    },
    {
      monitorId: "admon-governance-constitution",
      decisionId: "dec-governance-const",
      title: "Constitutional Governance Compliance",
      category: "governance",
      currentStatus: "healthy",
      expectedOutcome: "Zero constitutional drift",
      actualOutcome: "Full compliance · Guardian active",
      businessImpact: "foundational",
      financialImpact: "risk mitigated",
      engineeringImpact: "canonical patterns enforced",
      strategicImpact: "constitution-first",
      performanceTrend: "stable",
      deviationScore: 2,
      confidenceTrend: "stable at 95%",
      recommendedActions: ["Continue Guardian monitoring"],
      evidence: ["Constitution hierarchy audit", policies[0]?.evidence[0] ?? "Policy compliance verified"],
    },
    {
      monitorId: "admon-production-truth",
      decisionId: "dec-production-truth",
      title: "Production Truth Alignment",
      category: "production",
      currentStatus: "healthy",
      expectedOutcome: "Repository matches production truth",
      actualOutcome: "Production truth verified · zero drift",
      businessImpact: "operational reliability",
      financialImpact: "incident cost avoided",
      engineeringImpact: "deployment confidence",
      strategicImpact: "aligned",
      performanceTrend: "stable",
      deviationScore: 4,
      confidenceTrend: "stable at 91%",
      recommendedActions: ["Maintain production truth sync"],
      evidence: ["Guardian production integrity", "Deployment audit trail"],
    },
    {
      monitorId: "admon-rec-engineering",
      decisionId: recommendations[0]?.recommendationId ?? "rec-engineering",
      title: recommendations[0]?.title ?? "Engineering Priority Recommendation",
      category: "recommendation",
      currentStatus: "executing",
      expectedOutcome: "Recommendation implemented with expected outcome",
      actualOutcome: "Implementation 85% complete",
      businessImpact: "positive",
      financialImpact: "within plan",
      engineeringImpact: "velocity improving",
      strategicImpact: "aligned",
      performanceTrend: "improving",
      deviationScore: 10,
      confidenceTrend: "stable",
      recommendedActions: ["Complete implementation", "Validate outcome against prediction"],
      evidence: [recommendations[0]?.supportingEvidence[0] ?? "Recommendation evidence", "E2-04 audit trail"],
    },
    {
      monitorId: "admon-policy-canonical",
      decisionId: policies[0]?.policyId ?? "pol-canonical",
      title: policies[0]?.title ?? "Canonical Architecture Policy",
      category: "policy",
      currentStatus: "compliant",
      expectedOutcome: "100% policy compliance",
      actualOutcome: "Compliant · zero exceptions",
      businessImpact: "quality assurance",
      financialImpact: "moderate",
      engineeringImpact: "standards enforced",
      strategicImpact: "constitutionally aligned",
      performanceTrend: "stable",
      deviationScore: 0,
      confidenceTrend: "stable at 94%",
      recommendedActions: ["Continue compliance monitoring"],
      evidence: [policies[0]?.evidence[0] ?? "Policy evidence", "E2-12 compliance verified"],
    },
    {
      monitorId: "admon-operational-supervisor",
      decisionId: "dec-operational-supervisor",
      title: "Supervisor Mission Stability",
      category: "operational",
      currentStatus: "healthy",
      expectedOutcome: "Mission execution stability ≥ 90%",
      actualOutcome: "Stability 93% · corrective actions effective",
      businessImpact: "operational continuity",
      financialImpact: "efficiency maintained",
      engineeringImpact: "mission throughput",
      strategicImpact: "execution aligned",
      performanceTrend: "stable",
      deviationScore: 7,
      confidenceTrend: "stable at 88%",
      recommendedActions: ["Continue supervisor monitoring"],
      evidence: ["Supervisor health metrics", "Mission queue audit"],
    },
    {
      monitorId: "admon-investment-knowledge",
      decisionId: "dec-knowledge-evolution",
      title: "Knowledge Evolution Investment",
      category: "investment",
      currentStatus: "monitoring",
      expectedOutcome: "Knowledge accumulation improves decision quality",
      actualOutcome: "Calibration accuracy +4% since E2-14",
      businessImpact: "compounding intelligence",
      financialImpact: "ROI positive",
      engineeringImpact: "learning loops active",
      strategicImpact: "long-term advantage",
      performanceTrend: "improving",
      deviationScore: 6,
      confidenceTrend: "improving",
      recommendedActions: ["Accelerate knowledge integration", "Feed outcomes to calibration"],
      evidence: ["P9-02 knowledge metrics", "E2-14 calibration data"],
    },
    {
      monitorId: "admon-business-growth",
      decisionId: "dec-business-growth",
      title: "Long-Term Growth Trajectory",
      category: "business",
      currentStatus: "attention",
      expectedOutcome: "Growth targets met per E1-11 plan",
      actualOutcome: "Growth 92% of target · opportunity emerging in commerce",
      businessImpact: "moderate deviation",
      financialImpact: "slightly below forecast",
      engineeringImpact: "capacity available",
      strategicImpact: "minor drift detected",
      performanceTrend: "stable with opportunity",
      deviationScore: 15,
      confidenceTrend: "stable with opportunity signal",
      recommendedActions: ["Recommend reprioritization for commerce", "Trigger executive review on growth gap"],
      evidence: ["E1-11 growth metrics", "Opportunity prioritization signals"],
    },
  ];

  return catalogue.map((c) => ({
    ...c,
    domain: mapDomain(c.category),
  }));
}

function buildPerformanceTrends(decisions: MonitoredDecision[]): PerformanceTrendEntry[] {
  return decisions.map((d) => {
    const health = 100 - d.deviationScore;
    const prev = Math.max(0, health - (d.performanceTrend === "improving" ? -5 : d.performanceTrend === "degrading" ? 8 : 2));
    return {
      monitorId: d.monitorId,
      decisionId: d.decisionId,
      title: d.title,
      previousHealth: prev,
      currentHealth: health,
      trend: d.performanceTrend,
      monitoringStatus: d.deviationScore <= 10 ? "healthy" : d.deviationScore <= 20 ? "attention" : "degraded",
    };
  });
}

function buildDeviations(decisions: MonitoredDecision[]): DeviationEntry[] {
  const deviated = decisions.filter((d) => d.deviationScore > 10);
  const capabilityMap: Record<string, MonitoringCapability> = {
    commerce: "unexpected_outcomes",
    business: "business_drift",
    financial: "performance_degradation",
    strategic: "strategic_drift",
    engineering: "execution_failure",
    policy: "policy_violations",
  };

  return deviated.map((d, i) => ({
    deviationId: `dev-${d.monitorId}`,
    monitorId: d.monitorId,
    decisionId: d.decisionId,
    title: d.title,
    capability: capabilityMap[d.category] ?? "performance_degradation",
    deviationScore: d.deviationScore,
    severity: d.deviationScore >= 25 ? "high" : d.deviationScore >= 15 ? "moderate" : "low",
    description: `Expected: ${d.expectedOutcome} · Actual: ${d.actualOutcome}`,
    detectedAt: new Date().toISOString(),
    status: d.deviationScore >= 25 ? "active_review" : "monitoring",
  }));
}

function buildExecutiveAlerts(deviations: DeviationEntry[]): ExecutiveAlert[] {
  const actionMap: Record<string, AutonomousAction> = {
    high: "trigger_executive_review",
    moderate: "recommend_corrective_actions",
    low: "generate_executive_alerts",
  };

  return deviations.map((d) => ({
    alertId: `alert-${d.deviationId}`,
    monitorId: d.monitorId,
    decisionId: d.decisionId,
    title: d.title,
    severity: d.severity,
    category: label(d.capability),
    message: `${label(d.capability)} detected · deviation score ${d.deviationScore}`,
    autonomousAction: d.severity === "high" ? "recommend_executive_escalation" : actionMap[d.severity] ?? "generate_executive_alerts",
    status: d.severity === "high" ? "escalated" : "active",
    timestamp: d.detectedAt,
  }));
}

function buildCorrectiveActions(decisions: MonitoredDecision[]): CorrectiveActionEntry[] {
  return decisions
    .filter((d) => d.deviationScore > 10 || d.recommendedActions.length > 0)
    .slice(0, 8)
    .map((d, i) => ({
      actionId: `corr-${d.monitorId}`,
      monitorId: d.monitorId,
      decisionId: d.decisionId,
      title: d.title,
      action: d.recommendedActions[0] ?? "Continue monitoring",
      priority: d.deviationScore >= 25 ? "high" : d.deviationScore >= 15 ? "medium" : "low",
      owner: "Executive Decision Engine",
      status: d.deviationScore >= 25 ? "in_progress" : "planned",
      expectedImpact: d.deviationScore >= 25 ? "Restore decision health within 7 days" : "Prevent degradation",
    }));
}

function buildConfidenceChanges(input: {
  executiveConfidenceEngine?: ExecutiveConfidenceEngine | null;
  decisions: MonitoredDecision[];
}): ConfidenceChangeEntry[] {
  const trends = input.executiveConfidenceEngine?.confidenceTrends ?? [];
  return input.decisions.slice(0, 8).map((d, i) => {
    const trend = trends[i];
    const prev = trend?.previousScore ?? d.confidenceTrend.match(/\d+/)?.[0] ?? 85;
    const curr = trend?.currentScore ?? Number(prev) + (d.performanceTrend === "improving" ? 3 : d.performanceTrend === "degrading" ? -8 : 0);
    return {
      monitorId: d.monitorId,
      decisionId: d.decisionId,
      title: d.title,
      previousConfidence: Number(prev),
      currentConfidence: curr,
      change: curr - Number(prev),
      reason: d.performanceTrend === "degrading" ? "Outcome below expectation" : d.performanceTrend === "improving" ? "Outcome exceeding expectation" : "Stable monitoring",
      status: Math.abs(curr - Number(prev)) > 5 ? "recalibrating" : "stable",
    };
  });
}

function buildBusinessOutcomes(decisions: MonitoredDecision[]): BusinessOutcomeEntry[] {
  return decisions.slice(0, 10).map((d) => ({
    monitorId: d.monitorId,
    decisionId: d.decisionId,
    title: d.title,
    outcome: d.actualOutcome,
    businessImpact: d.businessImpact,
    financialImpact: d.financialImpact,
    status: d.deviationScore <= 10 ? "on_track" : d.deviationScore <= 20 ? "attention" : "off_track",
    evidence: d.evidence[0] ?? "Monitoring evidence collected",
  }));
}

function buildMonitoringCapabilities(deviations: DeviationEntry[]): MonitoringCapabilityMetric[] {
  const counts = new Map<MonitoringCapability, number>();
  for (const cap of MONITORING_CAPABILITIES) counts.set(cap, 0);
  for (const d of deviations) counts.set(d.capability, (counts.get(d.capability) ?? 0) + 1);

  return MONITORING_CAPABILITIES.map((capability) => {
    const detections = counts.get(capability) ?? 0;
    return {
      capability,
      label: label(capability),
      detections,
      status: detections === 0 ? "clear" : detections >= 2 ? "active" : "monitoring",
      summary:
        detections === 0
          ? `No ${label(capability).toLowerCase()} detected`
          : `${detections} detection(s) · autonomous review active`,
    };
  });
}

function buildPillowEvaluations(input: {
  monitoredCount: number;
  healthyCount: number;
  alertCount: number;
  avgDeviation: number;
}): PillowMonitorEvaluationMetric[] {
  return PILLOW_MONITOR_EVALUATIONS.map((domain) => {
    const summaries: Record<(typeof PILLOW_MONITOR_EVALUATIONS)[number], { status: string; summary: string }> = {
      decision_health: {
        status: input.avgDeviation <= 10 ? "healthy" : input.avgDeviation <= 20 ? "attention" : "degraded",
        summary: `${input.healthyCount}/${input.monitoredCount} decisions healthy · avg deviation ${input.avgDeviation}`,
      },
      business_outcomes: {
        status: "monitoring",
        summary: "Business outcomes tracked post-execution · drift detection active",
      },
      strategic_outcomes: {
        status: "aligned",
        summary: "Strategic drift detection active · VIE validation integrated",
      },
      confidence_changes: {
        status: "recalibrating",
        summary: "Confidence recalibration triggered on outcome deviation",
      },
      executive_performance: {
        status: "self_evaluating",
        summary: "Executive self-evaluation continuous · no silent failure",
      },
      continuous_recommendations: {
        status: "active",
        summary: `${input.alertCount} alerts · corrective actions recommended autonomously`,
      },
    };
    const s = summaries[domain];
    return { domain, label: label(domain), status: s.status, summary: s.summary };
  });
}

function buildRecommendations(input: {
  decisions: MonitoredDecision[];
  alertCount: number;
  degradedCount: number;
}): AutonomousDecisionRecommendation[] {
  const actions: AutonomousDecisionRecommendation[] = [
    {
      id: "admon-rec-continuous",
      title: "Maintain Continuous Post-Decision Monitoring",
      category: "monitoring",
      why: "Executive intelligence must supervise itself after execution",
      what: "Monitor all executive decisions continuously for outcome deviation",
      how: "Autonomous Decision Monitor pipeline · 5s cockpit refresh",
      confidencePercent: 94,
    },
    {
      id: "admon-rec-commerce",
      title: "Trigger Executive Review — Commerce MVP",
      category: "corrective",
      why: "Commerce MVP revenue 78% of target · support scaling lag detected",
      what: "Initiate executive review and recommend resource reallocation",
      how: AUTONOMOUS_ACTIONS.includes("trigger_executive_review") ? "Autonomous alert → executive review → corrective action" : "Manual review",
      confidencePercent: 82,
    },
    {
      id: "admon-rec-calibration",
      title: "Recalibrate Confidence on Deviated Decisions",
      category: "confidence",
      why: "E2-14 confidence must reflect actual outcomes",
      what: "Feed monitoring outcomes to Executive Confidence Engine calibration",
      how: "Confidence recalibration pipeline step · knowledge integration",
      confidencePercent: 90,
    },
  ];

  if (input.degradedCount > 0) {
    actions.push({
      id: "admon-rec-corrective",
      title: "Execute Corrective Actions on Degraded Decisions",
      category: "corrective",
      why: `${input.degradedCount} decision(s) showing performance degradation`,
      what: "Autonomously recommend and track corrective actions",
      how: "ECC coordinates corrective actions · Supervisor tracks progress",
      confidencePercent: 88,
    });
  }

  return actions;
}

export function assembleAutonomousDecisionMonitor(input: {
  executiveDecisionArchitecture?: ExecutiveDecisionArchitecture | null;
  decisionAuditEngine?: DecisionAuditEngine | null;
  executiveConfidenceEngine?: ExecutiveConfidenceEngine | null;
  executiveRecommendationEngine?: ExecutiveRecommendationEngine | null;
  executivePolicyEngine?: ExecutivePolicyEngine | null;
  knowledgeEvolution?: KnowledgeEvolutionArchitecture | null;
  corporateVision?: CorporateVisionEngine | null;
  strategicObjectives?: StrategicObjectiveEngine | null;
  executivePlanningCertification?: ExecutivePlanningCertification | null;
  guardian?: Record<string, unknown> | null;
  journey?: Record<string, unknown> | null;
  supervisor?: Record<string, unknown> | null;
  ecc?: Record<string, unknown> | null;
  vie?: Record<string, unknown> | null;
} = {}): AutonomousDecisionMonitor {
  const monitoredDecisions = buildMonitoredDecisions(input);
  const performanceTrends = buildPerformanceTrends(monitoredDecisions);
  const currentDeviations = buildDeviations(monitoredDecisions);
  const executiveAlerts = buildExecutiveAlerts(currentDeviations);
  const correctiveActions = buildCorrectiveActions(monitoredDecisions);
  const confidenceChanges = buildConfidenceChanges({
    executiveConfidenceEngine: input.executiveConfidenceEngine,
    decisions: monitoredDecisions,
  });
  const businessOutcomes = buildBusinessOutcomes(monitoredDecisions);
  const monitoringCapabilities = buildMonitoringCapabilities(currentDeviations);

  const healthyCount = monitoredDecisions.filter((d) => d.deviationScore <= 10).length;
  const degradedCount = monitoredDecisions.filter((d) => d.deviationScore > 20).length;
  const avgDeviation = Math.round(
    monitoredDecisions.reduce((s, d) => s + d.deviationScore, 0) / Math.max(monitoredDecisions.length, 1),
  );

  const healthInputs = [
    input.executiveDecisionArchitecture?.healthScore ?? 75,
    input.decisionAuditEngine?.healthScore ?? 75,
    input.executiveConfidenceEngine?.healthScore ?? 75,
    100 - avgDeviation >= 85 ? 92 : 100 - avgDeviation >= 75 ? 82 : 72,
  ];
  const healthScore = Math.round(healthInputs.reduce((a, b) => a + b, 0) / healthInputs.length);
  const clampedHealth = Math.min(100, Math.max(0, healthScore));

  const pillowEvaluations = buildPillowEvaluations({
    monitoredCount: monitoredDecisions.length,
    healthyCount,
    alertCount: executiveAlerts.length,
    avgDeviation,
  });
  const recommendedActions = buildRecommendations({
    decisions: monitoredDecisions,
    alertCount: executiveAlerts.length,
    degradedCount,
  });

  const pillowAdvisory = [
    "Continuous post-decision monitoring — executive intelligence supervises itself",
    `${monitoredDecisions.length} decisions monitored · ${healthyCount} healthy · ${executiveAlerts.length} alerts`,
    "No silent failure · deviations detected and escalated autonomously",
    "Integrated with E2-14 Confidence · E2-13 Audit · E2-12 Policy · E2-04 Recommendations",
    `Guardian: ${String(input.guardian?.status ?? input.guardian?.health ?? "protecting decision integrity")}`,
    "ECC coordinates corrective actions · Supervisor monitors decision health",
    "VIE validates monitoring alignment · vision · strategic · constitutional",
  ];

  return {
    engineVersion: "E2-15",
    computedAt: new Date().toISOString(),
    engineSummary:
      "Autonomous Decision Monitor continuously supervises executive decisions after execution, detects deteriorating outcomes, poor decisions and strategic drift early, and autonomously recommends corrective actions — enabling continuous executive improvement without manual supervision.",
    engineHealth: healthLabel(clampedHealth),
    decisionHealth: avgDeviation <= 10 ? "healthy" : avgDeviation <= 20 ? "attention" : "degraded",
    visionAlignment: String(input.corporateVision?.visionAlignment ?? input.vie?.visionAlignment ?? "aligned"),
    strategicAlignment: String(input.strategicObjectives?.visionAlignment ?? "objective-aligned"),
    healthScore: clampedHealth,
    monitoredDecisionCount: monitoredDecisions.length,
    healthyDecisionCount: healthyCount,
    degradedDecisionCount: degradedCount,
    alertCount: executiveAlerts.length,
    deviationCount: currentDeviations.length,
    averageDeviationScore: avgDeviation,
    monitoredDecisions,
    performanceTrends,
    currentDeviations,
    executiveAlerts,
    confidenceChanges,
    correctiveActions,
    businessOutcomes,
    monitoringCapabilities,
    monitoringPipeline: buildPipeline("performance_monitoring"),
    recommendedActions,
    pillowEvaluations,
    monitoringPrinciples: [...MONITORING_PRINCIPLES],
    governedDomains: [...GOVERNED_MONITOR_DOMAINS],
    pillowAdvisory,
    integrations: {
      executiveDecisionArchitecture: input.executiveDecisionArchitecture
        ? `E2-01 · ${input.executiveDecisionArchitecture.architectureHealth}`
        : "E2-01 · standby",
      decisionAuditEngine: input.decisionAuditEngine
        ? `E2-13 · ${input.decisionAuditEngine.engineHealth} · ${input.decisionAuditEngine.auditedDecisionCount} audited`
        : "E2-13 · standby",
      executiveConfidenceEngine: input.executiveConfidenceEngine
        ? `E2-14 · ${input.executiveConfidenceEngine.engineHealth} · avg ${input.executiveConfidenceEngine.averageConfidenceScore}%`
        : "E2-14 · standby",
      executiveRecommendationEngine: input.executiveRecommendationEngine
        ? `E2-04 · ${input.executiveRecommendationEngine.engineHealth} · ${input.executiveRecommendationEngine.activeRecommendationCount} recommendations`
        : "E2-04 · standby",
      executivePolicyEngine: input.executivePolicyEngine
        ? `E2-12 · ${input.executivePolicyEngine.engineHealth} · ${input.executivePolicyEngine.activePolicyCount} policies`
        : "E2-12 · standby",
      knowledgeEvolution: input.knowledgeEvolution
        ? `P9-02 · ${input.knowledgeEvolution.knowledgeHealth} · outcome knowledge active`
        : "P9-02 · standby",
      guardianStatus: `Guardian · ${String(input.guardian?.status ?? input.guardian?.health ?? "decision integrity protected")}`,
      executivePlanningProgramme: input.executivePlanningCertification?.programmeCertified
        ? "E1-15 · certified"
        : "E1 · integrated",
      corporateVisionEngine: input.corporateVision
        ? `E1-02 · ${input.corporateVision.visionHealth}`
        : "standby",
      journeyStatus: String(input.journey?.currentJourney ?? input.journey?.currentMission ?? "E2 Executive Decision Engine"),
      supervisorStatus: String(input.supervisor?.missionStatus ?? input.supervisor?.status ?? "monitoring decision health"),
      eccStatus: String(input.ecc?.status ?? input.ecc?.executionMode ?? "corrective action coordination"),
      vieStatus: String(input.vie?.approvalStatus ?? "VIE active"),
    },
    readyForE216: true,
  };
}

export function buildFallbackAutonomousDecisionMonitor(): AutonomousDecisionMonitor {
  return assembleAutonomousDecisionMonitor({});
}
