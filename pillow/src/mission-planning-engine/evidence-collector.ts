import { EXECUTION_STEP_IDS, MPENG_METADATA_VERSION } from "./paths.js";
import type { MissionPlanningEngineDependencies } from "./integrations.js";
import { nextPlanId } from "./audit-store.js";
import type {
  AcceptanceCriterion,
  ExecutionStep,
  ImplementationDependency,
  ImplementationRisk,
  IntegrationPoint,
  MissionAnalysis,
  MissionPlan,
  MpengInput,
  Q1302Observation,
  Q1303ContractConsumed,
  Q1303Prerequisite,
  RepositorySnapshotSummary,
  ValidationStrategyItem,
} from "./types.js";

export function analyseApprovedMission(input: MpengInput): MissionAnalysis {
  const missionId = input.missionId?.trim() ?? "";
  const missionName = input.missionName?.trim() ?? "";
  const programme = input.programme?.trim() || null;
  const evidenceProvided = Boolean(missionId && missionName);
  return {
    missionId: evidenceProvided ? missionId : "",
    missionName: evidenceProvided ? missionName : "",
    programme,
    evidenceProvided,
    analysedAt: new Date().toISOString(),
  };
}

export function consumeQ1303Contract(deps: MissionPlanningEngineDependencies): Q1303ContractConsumed {
  const rieng = deps.repositoryIntelligenceEngine;
  if (!rieng?.getQ1303ConsumableContract) {
    return {
      attempted: true,
      consumed: false,
      contractVersion: null,
      consumerMissionId: null,
      fields: [],
      evidence: "repositoryIntelligenceEngine.getQ1303ConsumableContract unavailable",
    };
  }
  const contract = rieng.getQ1303ConsumableContract();
  return {
    attempted: true,
    consumed: contract.consumerMissionId === "Q13-03",
    contractVersion: contract.contractVersion ?? null,
    consumerMissionId: contract.consumerMissionId ?? null,
    fields: [...(contract.exposedFields ?? [])],
    evidence: `q1303_contract consumer=${contract.consumerMissionId ?? "unknown"}`,
  };
}

export function observeQ1302Contract(deps: MissionPlanningEngineDependencies): Q1302Observation {
  const iseng = deps.implementationSpecificationEngine;
  if (!iseng?.getQ1302ConsumableContract) {
    return {
      attempted: true,
      consumed: false,
      contractVersion: null,
      fields: [],
      evidence: "implementationSpecificationEngine.getQ1302ConsumableContract unavailable (optional)",
    };
  }
  const contract = iseng.getQ1302ConsumableContract();
  return {
    attempted: true,
    consumed: true,
    contractVersion: contract.contractVersion ?? null,
    fields: [...(contract.exposedFields ?? [])],
    evidence: `q1302_observation consumer=${contract.consumerMissionId ?? "unknown"}`,
  };
}

export function verifyQ1303Prerequisite(deps: MissionPlanningEngineDependencies): Q1303Prerequisite {
  const riengPresent = Boolean(deps.repositoryIntelligenceEngine);
  const contract = consumeQ1303Contract(deps);
  const issues: string[] = [];
  if (!riengPresent) issues.push("repositoryIntelligenceEngine not bound");
  if (!contract.consumed) issues.push("Q1303 consumable contract not available");
  return {
    verified: riengPresent && contract.consumed,
    repositoryIntelligenceEnginePresent: riengPresent,
    q1303ContractAvailable: contract.consumed,
    outstandingPrerequisiteIssues: issues,
    evidence: [
      `repositoryIntelligenceEnginePresent=${riengPresent}`,
      contract.evidence,
    ],
  };
}

export function resolveRepositorySnapshot(deps: MissionPlanningEngineDependencies): RepositorySnapshotSummary {
  const report = deps.repositoryIntelligenceEngine?.getLatestReport?.();
  if (report?.snapshot) {
    return {
      repositorySnapshotId: report.snapshot.repositorySnapshotId ?? "unavailable",
      repositoryFingerprint: report.snapshot.repositoryFingerprint ?? "unavailable",
      repositoryVersion: report.snapshot.repositoryVersion ?? "unavailable",
      status: "available",
    };
  }
  return {
    repositorySnapshotId: "unavailable",
    repositoryFingerprint: "unavailable",
    repositoryVersion: "unavailable",
    status: "unavailable",
  };
}

export function identifyImplementationDependencies(
  deps: MissionPlanningEngineDependencies,
  analysis: MissionAnalysis,
): ImplementationDependency[] {
  const dependencies: ImplementationDependency[] = [];
  const q1303 = consumeQ1303Contract(deps);
  const q1302 = observeQ1302Contract(deps);
  const riengReport = deps.repositoryIntelligenceEngine?.getLatestReport?.();

  if (q1303.consumed) {
    dependencies.push({
      dependencyId: "dep-q1303-rieng",
      kind: "repository_intelligence",
      description: "Q1303 consumable contract from Repository Intelligence Engine",
      source: "repositoryIntelligenceEngine.getQ1303ConsumableContract",
      required: true,
      evidence: [q1303.evidence],
    });
  }

  if (q1302.consumed) {
    dependencies.push({
      dependencyId: "dep-q1302-iseng",
      kind: "specification",
      description: "Q1302 specification contract from Implementation Specification Engine",
      source: "implementationSpecificationEngine.getQ1302ConsumableContract",
      required: false,
      evidence: [q1302.evidence],
    });
  }

  if (riengReport?.dependencySummary) {
    dependencies.push({
      dependencyId: "dep-rieng-graph",
      kind: "module",
      description: `Repository dependency graph (${riengReport.dependencySummary.nodeCount ?? 0} nodes)`,
      source: "repositoryIntelligenceEngine.getLatestReport.dependencySummary",
      required: true,
      evidence: [`nodeCount=${riengReport.dependencySummary.nodeCount ?? 0}`],
    });
  }

  if (analysis.missionId) {
    dependencies.push({
      dependencyId: "dep-mission-context",
      kind: "governance",
      description: `Approved mission context for ${analysis.missionId}`,
      source: "explicit mission input",
      required: true,
      evidence: [`missionId=${analysis.missionId}`, `missionName=${analysis.missionName}`],
    });
  }

  if (deps.pillowOrchestrationRuntime) {
    dependencies.push({
      dependencyId: "dep-pillow-orchestration",
      kind: "integration",
      description: "Pillow orchestration runtime topology",
      source: "pillowOrchestrationRuntime",
      required: false,
      evidence: ["pillowOrchestrationRuntime bound"],
    });
  }

  return dependencies;
}

export function determineExecutionSequence(): ExecutionStep[] {
  const labels: Record<(typeof EXECUTION_STEP_IDS)[number], { label: string; description: string }> = {
    parse_mission: {
      label: "Parse Mission",
      description: "Parse missionId, missionName, and programme from explicit approved input",
    },
    preserve_existing: {
      label: "Preserve Existing",
      description: "Identify and preserve existing implementations; never overwrite without governance",
    },
    scaffold: {
      label: "Scaffold",
      description: "Plan scaffold structure following CRT pattern from prior Q missions",
    },
    integrate: {
      label: "Integrate",
      description: "Plan session, routes, bridge, subsystem-registry, and runtime integrations",
    },
    validate: {
      label: "Validate",
      description: "Plan unit tests, regression against prior mission, and governance lock verification",
    },
    accept: {
      label: "Accept",
      description: "Plan acceptance criteria mapped to mission validation section",
    },
  };

  return EXECUTION_STEP_IDS.map((stepId, index) => ({
    stepId,
    order: index + 1,
    label: labels[stepId].label,
    description: labels[stepId].description,
    deterministic: true as const,
  }));
}

export function identifyIntegrationPoints(deps: MissionPlanningEngineDependencies): IntegrationPoint[] {
  const points: IntegrationPoint[] = [
    {
      pointId: "int-pillow-session",
      target: "pillow/src/session.ts",
      kind: "session",
      description: "Pillow session variable and bindIntegrations after repositoryIntelligenceEngine",
      evidence: ["session.ts wiring pattern"],
    },
    {
      pointId: "int-pillow-host-routes",
      target: "/api/pillow/mission-planning-engine/*",
      kind: "route",
      description: "Authenticated Pillow host routes for planning operations",
      evidence: ["pillow-routes.ts pattern"],
    },
    {
      pointId: "int-executive-reporting",
      target: "executiveReportingRuntime",
      kind: "reporting",
      description: "Submit mission planning reports via executive reporting runtime",
      evidence: [deps.executiveReportingRuntime ? "executiveReportingRuntime bound" : "executiveReportingRuntime optional"],
    },
    {
      pointId: "int-audit-runtime",
      target: "auditRuntime",
      kind: "audit",
      description: "Audit trail for planning operations",
      evidence: [deps.auditRuntime ? "auditRuntime bound" : "auditRuntime optional"],
    },
    {
      pointId: "int-orchestration",
      target: "pillowOrchestrationRuntime",
      kind: "orchestration",
      description: "Orchestration topology for planning workflow placement",
      evidence: [deps.pillowOrchestrationRuntime ? "pillowOrchestrationRuntime bound" : "pillowOrchestrationRuntime optional"],
    },
    {
      pointId: "int-subsystem-registry",
      target: "pillow/src/orchestrator/subsystem-registry.ts",
      kind: "session",
      description: "Subsystem registry probe for mission-planning-engine",
      evidence: ["subsystem-registry.ts pattern"],
    },
  ];

  if (deps.repositoryIntelligenceEngine) {
    points.push({
      pointId: "int-rieng",
      target: "repositoryIntelligenceEngine",
      kind: "runtime",
      description: "Consume Q1303 contract and RIENG reports for planning input",
      evidence: ["repositoryIntelligenceEngine bound"],
    });
  }

  if (deps.implementationSpecificationEngine) {
    points.push({
      pointId: "int-iseng",
      target: "implementationSpecificationEngine",
      kind: "runtime",
      description: "Optional ISENG specifications as planning input",
      evidence: ["implementationSpecificationEngine bound"],
    });
  }

  return points;
}

export function produceValidationStrategy(analysis: MissionAnalysis): ValidationStrategyItem[] {
  return [
    {
      itemId: "val-unit-tests",
      category: "unit_test",
      description: "12 validation tests in mission-planning-engine.test.ts",
      required: true,
    },
    {
      itemId: "val-regression-rieng",
      category: "regression",
      description: "Regression run with repository-intelligence-engine.test.ts (24/24)",
      required: true,
    },
    {
      itemId: "val-governance-locks",
      category: "governance_lock",
      description: "Verify neverModifyRepository, neverExecuteImplementation, neverImplementQ1304OrLater",
      required: true,
    },
    {
      itemId: "val-integration-handshakes",
      category: "integration",
      description: "Verify integration handshakes for RIENG, ISENG, audit, ERR, orchestration",
      required: true,
    },
    {
      itemId: "val-acceptance-mission",
      category: "acceptance",
      description: `Acceptance criteria mapped to mission ${analysis.missionId || "Q13-03"} validation section`,
      required: true,
    },
  ];
}

export function produceAcceptanceCriteria(analysis: MissionAnalysis): AcceptanceCriterion[] {
  const missionRef = analysis.missionId || "Q13-03";
  return [
    {
      criterionId: "acc-engine-init",
      section: "Engine Initialization",
      description: "PILLOW-MPENG-001 initializes with Q13-03 mission guard",
      mappedTo: `${missionRef}:engine-init`,
      required: true,
    },
    {
      criterionId: "acc-q1303-consume",
      section: "Repository Intelligence Consumption",
      description: "Consumes Q1303 contract from repositoryIntelligenceEngine without fabricating state",
      mappedTo: `${missionRef}:q1303-consumption`,
      required: true,
    },
    {
      criterionId: "acc-plan-complete",
      section: "Mission Plan",
      description: "Generates complete MissionPlan with all locked minimum fields",
      mappedTo: `${missionRef}:mission-plan`,
      required: true,
    },
    {
      criterionId: "acc-report-q1304",
      section: "Q1304 Contract",
      description: "Emits Q1304 consumable contract as structural signal only; never implements Q13-04",
      mappedTo: `${missionRef}:q1304-contract`,
      required: true,
    },
    {
      criterionId: "acc-boundaries",
      section: "Governance Boundaries",
      description: "Rejects fabricate/modify/execute/bypass governance / ignore dependencies",
      mappedTo: `${missionRef}:boundaries`,
      required: true,
    },
  ];
}

export function estimateImplementationRisks(
  prerequisite: Q1303Prerequisite,
  deps: MissionPlanningEngineDependencies,
): ImplementationRisk[] {
  const risks: ImplementationRisk[] = [];

  risks.push({
    riskId: "risk-fabrication",
    category: "fabrication",
    description: "Fabricating repository state not present in RIENG report",
    severity: "high",
    mitigation: "Consume getQ1303ConsumableContract and getLatestReport only; mark unavailable when absent",
    evidence: ["neverFabricateRepositoryState=true"],
  });

  risks.push({
    riskId: "risk-overwrite",
    category: "overwrite",
    description: "Overwriting legacy planner or prior Q mission implementations",
    severity: "high",
    mitigation: "Preserve existing implementations; soft collision with legacy pillow/src/planner/",
    evidence: ["preserve_existing execution step"],
  });

  risks.push({
    riskId: "risk-governance-bypass",
    category: "governance_bypass",
    description: "Bypassing Pillow/Grand King governance controls",
    severity: "high",
    mitigation: "Require pillowCommandConfirmed; reject bypassGovernance/overridePillow/overrideGrandKing",
    evidence: ["neverBypassGovernance=true"],
  });

  if (!prerequisite.verified) {
    risks.push({
      riskId: "risk-missing-rieng",
      category: "missing_rieng",
      description: "Planning without Q1303 repository intelligence prerequisite",
      severity: "high",
      mitigation: "Bind repositoryIntelligenceEngine and consume Q1303 contract before planning",
      evidence: prerequisite.evidence,
    });
  }

  risks.push({
    riskId: "risk-scope-creep-q1304",
    category: "scope_creep",
    description: "Scope creep into Q13-04 Cursor Specification Generator or later",
    severity: "high",
    mitigation: "Emit Q1304 contract as structural signal only; neverImplementQ1304OrLater=true",
    evidence: ["neverImplementQ1304OrLater=true"],
  });

  if (!deps.auditRuntime) {
    risks.push({
      riskId: "risk-audit-gap",
      category: "integration_gap",
      description: "Audit runtime not bound for planning trail",
      severity: "medium",
      mitigation: "Bind auditRuntime during session initialization",
      evidence: ["auditRuntime unbound"],
    });
  }

  return risks;
}

export function buildMissionPlan(params: {
  analysis: MissionAnalysis;
  repositorySnapshot: RepositorySnapshotSummary;
  dependencies: ImplementationDependency[];
  executionOrder: ExecutionStep[];
  integrationPoints: IntegrationPoint[];
  validationStrategy: ValidationStrategyItem[];
  acceptanceCriteria: AcceptanceCriterion[];
  risks: ImplementationRisk[];
  planId?: string;
}): MissionPlan {
  const {
    analysis,
    repositorySnapshot,
    dependencies,
    executionOrder,
    integrationPoints,
    validationStrategy,
    acceptanceCriteria,
    risks,
  } = params;

  const complexity =
    dependencies.length >= 5 ? "high" : dependencies.length >= 3 ? "medium" : "low";

  return {
    planId: params.planId ?? nextPlanId(),
    version: MPENG_METADATA_VERSION,
    missionId: analysis.missionId || "Q13-03",
    missionName: analysis.missionName || "Mission Planning Engine",
    repositorySnapshot,
    dependencies,
    executionOrder,
    integrationPoints,
    validationStrategy,
    acceptanceCriteria,
    risks,
    constraints: [
      "neverModifyRepository",
      "neverExecuteImplementation",
      "neverFabricateRepositoryState",
      "neverImplementQ1304OrLater",
      "neverBypassGovernance",
      "neverAutoDeploy",
      "planningOnly",
    ],
    estimatedScope: {
      complexity,
      stepCount: executionOrder.length,
      dependencyCount: dependencies.length,
      integrationPointCount: integrationPoints.length,
    },
    governanceRequirements: [
      "Pillow session wiring after repositoryIntelligenceEngine",
      "Authenticated host routes under /api/pillow/mission-planning-engine/*",
      "Subsystem registry probe mission-planning-engine",
      "Cert pack under docs/audits/pillow/q13-03-mission-planning-engine/",
    ],
    timestamp: new Date().toISOString(),
  };
}

export function computeConfidenceScore(
  prerequisite: Q1303Prerequisite,
  validationDecision: string,
  dependencyCount: number,
): number {
  let score = 0.4;
  if (prerequisite.verified) score += 0.25;
  if (prerequisite.repositoryIntelligenceEnginePresent) score += 0.1;
  if (dependencyCount >= 2) score += 0.1;
  if (validationDecision !== "failed") score += 0.1;
  return Math.min(0.95, Math.max(0.1, score));
}

export function buildOutstandingIssues(
  prerequisite: Q1303Prerequisite,
  q1303: Q1303ContractConsumed,
): string[] {
  const issues = [...prerequisite.outstandingPrerequisiteIssues];
  if (!q1303.consumed) issues.push("Q1303 contract not consumed");
  return issues;
}

export function buildRiskSummary(risks: ImplementationRisk[]) {
  return { count: risks.length, risks: risks.map((r) => ({ ...r, evidence: [...r.evidence] })) };
}
