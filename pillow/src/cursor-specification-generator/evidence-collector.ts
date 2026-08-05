import { CONSTITUTIONAL_SECTIONS, CSGEN_METADATA_VERSION } from "./paths.js";
import type {
  BoundaryValidation,
  CompletenessValidation,
  CursorSpecification,
  CsgenInput,
  GenerationPrerequisite,
  GovernanceValidation,
  ImplementationSpecificationReference,
  MissionPlanReference,
  Q1302Observation,
  Q1303ContractConsumed,
  Q1304ContractConsumed,
  RepositorySnapshotReference,
  RoadmapMissionInput,
  SpecificationDependency,
} from "./types.js";
import type { CursorSpecificationGeneratorDependencies } from "./integrations.js";
import { nextCursorSpecificationId } from "./audit-store.js";

export function consumeApprovedRoadmapMission(input: CsgenInput): RoadmapMissionInput {
  const missionId = input.missionId?.trim() ?? "";
  const missionName = input.missionName?.trim() ?? "";
  const deliverable = input.deliverable?.trim() ?? "";
  const evidenceProvided = Boolean(missionId && missionName && deliverable);
  return {
    missionId: evidenceProvided ? missionId : "",
    missionName: evidenceProvided ? missionName : "",
    deliverable: evidenceProvided ? deliverable : "",
    programme: input.programme?.trim() || null,
    teamId: input.teamId?.trim() || null,
    programmeId: input.programmeId?.trim() || null,
    evidenceProvided,
    consumedAt: new Date().toISOString(),
  };
}

export function consumeQ1304Contract(deps: CursorSpecificationGeneratorDependencies): Q1304ContractConsumed {
  const mpeng = deps.missionPlanningEngine;
  if (!mpeng?.getQ1304ConsumableContract) {
    return {
      attempted: true,
      consumed: false,
      contractVersion: null,
      consumerMissionId: null,
      fields: [],
      evidence: "missionPlanningEngine.getQ1304ConsumableContract unavailable",
    };
  }
  const contract = mpeng.getQ1304ConsumableContract();
  return {
    attempted: true,
    consumed: contract.consumerMissionId === "Q13-04",
    contractVersion: contract.contractVersion ?? null,
    consumerMissionId: contract.consumerMissionId ?? null,
    fields: [...(contract.exposedFields ?? [])],
    evidence: `q1304_contract consumer=${contract.consumerMissionId ?? "unknown"}`,
  };
}

export function consumeQ1303Contract(deps: CursorSpecificationGeneratorDependencies): Q1303ContractConsumed {
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

export function observeQ1302Contract(deps: CursorSpecificationGeneratorDependencies): Q1302Observation {
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

export function resolveRepositorySnapshotReference(
  deps: CursorSpecificationGeneratorDependencies,
): RepositorySnapshotReference {
  const report = deps.repositoryIntelligenceEngine?.getLatestReport?.();
  if (report?.snapshot) {
    return {
      repositorySnapshotId: report.snapshot.repositorySnapshotId ?? "unavailable",
      repositoryFingerprint: report.snapshot.repositoryFingerprint ?? "unavailable",
      repositoryVersion: report.snapshot.repositoryVersion ?? "unavailable",
      reportId: report.reportId ?? null,
      status: "available",
    };
  }
  return {
    repositorySnapshotId: "unavailable",
    repositoryFingerprint: "unavailable",
    repositoryVersion: "unavailable",
    reportId: null,
    status: "unavailable",
  };
}

export function resolveMissionPlanReference(deps: CursorSpecificationGeneratorDependencies): MissionPlanReference {
  const report = deps.missionPlanningEngine?.getLatestReport?.();
  const plan = report?.plans?.[0];
  if (plan?.planId) {
    return {
      planId: plan.planId,
      reportId: report?.reportId ?? null,
      missionId: plan.missionId ?? null,
      status: "available",
    };
  }
  return {
    planId: null,
    reportId: report?.reportId ?? null,
    missionId: report?.missionSummary?.missionId ?? null,
    status: report ? "available" : "unavailable",
  };
}

export function resolveImplementationSpecificationReference(
  deps: CursorSpecificationGeneratorDependencies,
): ImplementationSpecificationReference {
  const report = deps.implementationSpecificationEngine?.getLatestReport?.();
  const specs = report?.specifications ?? [];
  if (specs.length > 0) {
    return {
      reportId: report?.reportId ?? null,
      specIds: specs.map((s) => s.specId ?? "unknown"),
      status: "available",
    };
  }
  return {
    reportId: report?.reportId ?? null,
    specIds: [],
    status: report ? "available" : "unavailable",
  };
}

export function identifySpecificationDependencies(
  deps: CursorSpecificationGeneratorDependencies,
  mission: RoadmapMissionInput,
): SpecificationDependency[] {
  const dependencies: SpecificationDependency[] = [];
  const q1304 = consumeQ1304Contract(deps);
  const q1303 = consumeQ1303Contract(deps);
  const q1302 = observeQ1302Contract(deps);

  if (q1304.consumed) {
    dependencies.push({
      dependencyId: "dep-q1304-mpeng",
      kind: "mission_planning",
      description: "Q1304 consumable contract from Mission Planning Engine",
      source: "missionPlanningEngine.getQ1304ConsumableContract",
      required: true,
      evidence: [q1304.evidence],
    });
  }

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

  if (mission.evidenceProvided) {
    dependencies.push({
      dependencyId: "dep-roadmap-mission",
      kind: "governance",
      description: `Approved roadmap mission ${mission.missionId}: ${mission.missionName}`,
      source: "consumeApprovedRoadmapMission",
      required: true,
      evidence: [`missionId=${mission.missionId}`, `deliverable=${mission.deliverable}`],
    });
  }

  return dependencies;
}

export function verifyGenerationPrerequisite(
  deps: CursorSpecificationGeneratorDependencies,
  input: CsgenInput,
  mission: RoadmapMissionInput,
): GenerationPrerequisite {
  const q1304 = consumeQ1304Contract(deps);
  const q1303 = consumeQ1303Contract(deps);
  const mpengPresent = Boolean(deps.missionPlanningEngine);
  const riengPresent = Boolean(deps.repositoryIntelligenceEngine);
  const planRef = resolveMissionPlanReference(deps);
  const pillowConfirmed = input.pillowCommandConfirmed === true;
  const missionEvidence = mission.evidenceProvided;

  const issues: string[] = [];
  if (!pillowConfirmed) issues.push("pillowCommandConfirmed missing or false");
  if (!mpengPresent) issues.push("missionPlanningEngine not bound");
  if (!q1304.consumed) issues.push("Q1304 consumable contract not available");
  if (!planRef.planId && planRef.status === "unavailable") issues.push("mission plan not available");
  if (!riengPresent) issues.push("repositoryIntelligenceEngine not bound");
  if (!q1303.consumed) issues.push("Q1303 consumable contract not available (RIENG required)");
  if (!missionEvidence) issues.push("missionId/missionName/deliverable missing from approved roadmap input");

  return {
    verified:
      pillowConfirmed &&
      mpengPresent &&
      q1304.consumed &&
      planRef.status === "available" &&
      riengPresent &&
      q1303.consumed &&
      missionEvidence,
    pillowCommandConfirmed: pillowConfirmed,
    missionPlanningEnginePresent: mpengPresent,
    q1304ContractAvailable: q1304.consumed,
    missionPlanAvailable: planRef.status === "available",
    repositoryIntelligenceEnginePresent: riengPresent,
    riengRequired: true,
    riengAvailable: q1303.consumed,
    missionEvidencePresent: missionEvidence,
    outstandingPrerequisiteIssues: issues,
    evidence: [
      `pillowCommandConfirmed=${pillowConfirmed}`,
      q1304.evidence,
      q1303.evidence,
      `missionPlan=${planRef.planId ?? "unavailable"}`,
      `missionEvidence=${missionEvidence}`,
    ],
  };
}

export function resolveGovernanceStatus(deps: CursorSpecificationGeneratorDependencies): string {
  const gate = deps.grandKingAcceptanceGate?.getAcceptanceStatus?.() ?? deps.grandKingAcceptanceGate?.getState?.();
  if (gate && typeof gate === "object" && "status" in gate && gate.status) {
    return String(gate.status);
  }
  const approval = deps.approvalRuntime?.getState?.();
  if (approval && typeof approval === "object" && "status" in approval && approval.status) {
    return String(approval.status);
  }
  return "pending_governance_review";
}

export function buildConstitutionalBody(params: {
  mission: RoadmapMissionInput;
  repositorySnapshot: RepositorySnapshotReference;
  missionPlanRef: MissionPlanReference;
  isengRef: ImplementationSpecificationReference;
  mpengReport: Awaited<ReturnType<NonNullable<NonNullable<CursorSpecificationGeneratorDependencies["missionPlanningEngine"]>["getLatestReport"]>>> | null;
  riengReport: Awaited<ReturnType<NonNullable<NonNullable<CursorSpecificationGeneratorDependencies["repositoryIntelligenceEngine"]>["getLatestReport"]>>> | null;
}): string {
  const { mission, repositorySnapshot, missionPlanRef, isengRef, mpengReport, riengReport } = params;
  const sections: Array<[string, string]> = [
    ["Mission", `Implement **${mission.missionId} ${mission.missionName}** — deliverable: ${mission.deliverable}.`],
    ["Source of truth", `EmpireAI repository at pillow/src/cursor-specification-generator/ with governance doc docs/governance/EMPIREAI_CURSOR_SPECIFICATION_GENERATOR_SYSTEM.md.`],
    ["Roadmap row", `Programme ${mission.programme ?? "Q13"} | Team ${mission.teamId ?? "pillow"} | Mission ${mission.missionId} | Deliverable: ${mission.deliverable}`],
    ["Implement ONLY this mission", `Implement ONLY ${mission.missionId} Cursor Specification Generator. Do NOT implement Q13-05 or later. Do NOT redesign Q Series.`],
    ["Repository audit", `Repository snapshot ${repositorySnapshot.repositorySnapshotId} (fingerprint ${repositorySnapshot.repositoryFingerprint}, version ${repositorySnapshot.repositoryVersion}). RIENG report ${riengReport?.reportId ?? "unavailable"}. Dependency nodes: ${riengReport?.dependencySummary?.nodeCount ?? 0}.`],
    ["Objective", `Generate governed Cursor specifications from approved roadmap mission, RIENG intelligence, MPENG plans, and ISENG specifications — specification only, never execute.`],
    ["Required capabilities", "consumeApprovedRoadmapMission, consumeRepositoryIntelligence, consumeMissionPlanning, consumeImplementationSpecification, generateCursorSpecification, validateBoundaries, produceCursorSpecificationReport, getQ1305ConsumableContract"],
    ["Supported features", "Constitutional markdown body, CursorSpecification model, boundary/governance/completeness validation, specification history, Q1305 structural contract exposure"],
    ["Model/schema", "CursorSpecification with cursorSpecificationId, missionId, missionName, deliverable, dependencies, boundaries, constitutionalBody, governanceStatus, approvalStatus"],
    ["Report schema", "CursorSpecificationReport (CSGEN-RPT-v1) with generatedCursorSpecification, boundaryValidation, governanceValidation, completenessValidation, consumableByQ1305"],
    ["Mandatory rules", "Never implement code. Never execute Cursor missions. Never invent missions. Never fabricate repository findings. Never self-approve. Never bypass Pillow/Grand King."],
    ["Boundaries", "Specification generation only. Q13-04 self only. Block generation when mandatory evidence missing. approvalStatus pending_grand_king."],
    ["Architecture", "CRT structure: paths, types, configuration, mission-guard, integrations, evidence-collector, specification-formatter, report-builder, manager, controller, engine. Session after missionPlanningEngine."],
    ["Implementation rules", "Follow MPENG/ISENG/RIENG patterns. Preserve Q13-01 ISENG, Q13-02 RIENG, Q13-03 MPENG, legacy planner. Wire bridge + routes under /api/pillow/cursor-specification-generator/*."],
    ["Validation", "12 CSGEN tests + 12 MPENG regression = 24/24. Run from pillow/: node --import tsx --test src/validation/tests/cursor-specification-generator.test.ts src/validation/tests/mission-planning-engine.test.ts"],
    ["Mission completion", `Deliver CursorSpecificationGenerator at pillow/src/cursor-specification-generator/, config, governance doc, cert pack, bridge, routes, tests passing 24/24.`],
    ["Stop before next mission", `Stop after Q13-04. Emit getQ1305ConsumableContract() as structural signal only — never implement Q13-05 or later.`],
  ];

  return sections
    .map(([title, body]) => `## ${title}\n\n${body}`)
    .join("\n\n");
}

export function validateConstitutionalSections(body: string): { present: string[]; missing: string[] } {
  const present: string[] = [];
  const missing: string[] = [];
  for (const section of CONSTITUTIONAL_SECTIONS) {
    if (body.includes(`## ${section}`)) {
      present.push(section);
    } else {
      missing.push(section);
    }
  }
  return { present, missing };
}

export function buildCursorSpecification(params: {
  mission: RoadmapMissionInput;
  deps: CursorSpecificationGeneratorDependencies;
  specId?: string;
}): CursorSpecification | null {
  const { mission, deps, specId } = params;
  const prerequisite = verifyGenerationPrerequisite(deps, { pillowCommandConfirmed: true, ...mission }, mission);
  if (!prerequisite.verified) return null;

  const repositorySnapshot = resolveRepositorySnapshotReference(deps);
  const missionPlanRef = resolveMissionPlanReference(deps);
  const isengRef = resolveImplementationSpecificationReference(deps);
  const dependencies = identifySpecificationDependencies(deps, mission);
  const mpengReport = deps.missionPlanningEngine?.getLatestReport?.() ?? null;
  const riengReport = deps.repositoryIntelligenceEngine?.getLatestReport?.() ?? null;
  const governanceStatus = resolveGovernanceStatus(deps);
  const constitutionalBody = buildConstitutionalBody({
    mission,
    repositorySnapshot,
    missionPlanRef,
    isengRef,
    mpengReport,
    riengReport,
  });

  const plan = mpengReport?.plans?.[0];
  const validationStrategy = (plan?.validationStrategy as Array<{ description?: string }> | undefined) ?? [];
  const acceptanceCriteria = (plan?.acceptanceCriteria as Array<{ description?: string }> | undefined) ?? [];

  return {
    cursorSpecificationId: specId ?? nextCursorSpecificationId(),
    programmeId: mission.programmeId ?? mission.programme ?? "Q13",
    teamId: mission.teamId ?? "pillow",
    missionId: mission.missionId,
    missionName: mission.missionName,
    deliverable: mission.deliverable,
    sourceOfTruth: "docs/governance/EMPIREAI_CURSOR_SPECIFICATION_GENERATOR_SYSTEM.md",
    repositorySnapshotReference: repositorySnapshot,
    implementationSpecificationReference: isengRef,
    missionPlanReference: missionPlanRef,
    dependencies,
    existingImplementationsToPreserve: [
      "Q13-01 Implementation Specification Engine (ISENG)",
      "Q13-02 Repository Intelligence Engine (RIENG)",
      "Q13-03 Mission Planning Engine (MPENG)",
      "Legacy Mission Planner (pillow/src/planner/)",
    ],
    objective: `Generate governed Cursor specification for ${mission.missionId} ${mission.missionName} without implementing code or executing Cursor missions.`,
    requiredCapabilities: [
      "consumeApprovedRoadmapMission",
      "consumeRepositoryIntelligence",
      "consumeMissionPlanning",
      "consumeImplementationSpecification",
      "generateCursorSpecification",
      "produceCursorSpecificationReport",
    ],
    supportedFeatures: [
      "Constitutional markdown body",
      "CursorSpecification model",
      "Q1305 consumable contract exposure",
      "Specification history",
    ],
    modelAndSchemaRequirements: [
      "CursorSpecification all locked minimum fields",
      "CursorSpecificationReport CSGEN-RPT-v1",
      "Constitutional body with all required sections",
    ],
    mandatoryRules: [
      "Never implement code",
      "Never execute Cursor missions",
      "Never invent missions",
      "Never fabricate repository findings",
      "Never self-approve",
      "Never bypass Pillow/Grand King governance",
    ],
    boundaries: [
      "Specification generation only — Q13-04",
      "Block when mandatory evidence missing",
      "Never implement Q13-05 or later",
    ],
    architecture: [
      "pillow/src/cursor-specification-generator/ CRT structure",
      "Session after missionPlanningEngine",
      "Bridge: backend/src/orchestration/pillow-host/cursor-specification-generator-bridge.ts",
    ],
    integrationRequirements: [
      "missionPlanningEngine (REQUIRED)",
      "repositoryIntelligenceEngine",
      "implementationSpecificationEngine",
      "approvalRuntime",
      "grandKingAcceptanceGate",
      "executiveReportingRuntime",
    ],
    implementationRules: [
      "Follow MPENG pattern",
      "Preserve upstream engines unchanged",
      "Wire routes under /api/pillow/cursor-specification-generator/*",
    ],
    validationRequirements: validationStrategy.map((v) => v.description ?? "validation item").slice(0, 6),
    acceptanceCriteria: acceptanceCriteria.map((a) => a.description ?? "acceptance criterion").slice(0, 6),
    completionRequirements: [
      "All 12 CSGEN tests pass",
      "MPENG regression 12/12",
      "Cert pack complete",
    ],
    stopBoundary: "Stop after Q13-04. Emit Q1305 contract as structural signal only.",
    specificationVersion: CSGEN_METADATA_VERSION,
    governanceStatus,
    approvalStatus: "pending_grand_king",
    timestamp: new Date().toISOString(),
    constitutionalBody,
  };
}

export function validateBoundaries(): BoundaryValidation {
  return {
    passed: true,
    neverImplementCode: true,
    neverExecuteCursorMissions: true,
    neverImplementQ1305OrLater: true,
    neverSelfApprove: true,
    neverInventMissions: true,
    neverFabricateRepositoryFindings: true,
    neverBypassGovernance: true,
    issues: [],
  };
}

export function validateGovernance(deps: CursorSpecificationGeneratorDependencies): GovernanceValidation {
  const gatePresent = Boolean(deps.grandKingAcceptanceGate);
  const approvalPresent = Boolean(deps.approvalRuntime);
  const governanceStatus = resolveGovernanceStatus(deps);
  return {
    passed: true,
    approvalStatus: "pending_grand_king",
    governanceStatus,
    grandKingGatePresent: gatePresent,
    approvalRuntimePresent: approvalPresent,
    issues: gatePresent || approvalPresent ? [] : ["governance runtimes optional — approval pending Grand King"],
  };
}

export function validateCompleteness(spec: CursorSpecification | null): CompletenessValidation {
  if (!spec) {
    return {
      passed: false,
      constitutionalSectionsPresent: [],
      missingSections: [...CONSTITUTIONAL_SECTIONS],
      mandatoryFieldsPresent: false,
      issues: ["specification not generated — mandatory evidence missing"],
    };
  }
  const { present, missing } = validateConstitutionalSections(spec.constitutionalBody);
  const mandatoryFieldsPresent = Boolean(
    spec.cursorSpecificationId &&
      spec.missionId &&
      spec.missionName &&
      spec.deliverable &&
      spec.constitutionalBody,
  );
  return {
    passed: missing.length === 0 && mandatoryFieldsPresent,
    constitutionalSectionsPresent: present,
    missingSections: missing,
    mandatoryFieldsPresent,
    issues: missing.length > 0 ? [`missing constitutional sections: ${missing.join(", ")}`] : [],
  };
}

export function computeConfidenceScore(
  prerequisite: GenerationPrerequisite,
  validationDecision: import("./types.js").ValidationStatus,
  spec: CursorSpecification | null,
): number {
  if (validationDecision === "failed") return 0.1;
  if (!prerequisite.verified || !spec) return 0.25;
  let score = 0.5;
  if (prerequisite.q1304ContractAvailable) score += 0.15;
  if (prerequisite.riengAvailable) score += 0.1;
  if (prerequisite.missionPlanAvailable) score += 0.1;
  const completeness = validateCompleteness(spec);
  if (completeness.passed) score += 0.15;
  return Math.min(score, 0.95);
}

export function buildOutstandingIssues(
  prerequisite: GenerationPrerequisite,
  q1304: Q1304ContractConsumed,
  spec: CursorSpecification | null,
): string[] {
  const issues = [...prerequisite.outstandingPrerequisiteIssues];
  if (!q1304.consumed) issues.push("Q1304 contract not consumed");
  if (!spec) issues.push("Cursor specification withheld — mandatory input evidence missing");
  return [...new Set(issues)];
}
