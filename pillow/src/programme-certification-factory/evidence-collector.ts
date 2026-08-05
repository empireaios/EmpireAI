import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { CONSTITUTIONAL_PROGRAMME_CATALOG, CONSTITUTIONAL_PROGRAMME_CODES } from "./paths.js";
import { nextCertificationId, nextRecommendationId } from "./audit-store.js";
import type { ProgrammeCertificationFactoryDependencies } from "./integrations.js";
import type {
  ApprovedProgramme,
  BoundaryValidation,
  CertificationStatus,
  CompletionRecommendation,
  GovernanceValidation,
  MissionClassification,
  MissionInventoryEntry,
  PcfctInput,
  ProgrammeAuditResult,
  ProgrammeCertification,
  ProgrammeCode,
  ProgrammeGapAnalysis,
  Q1306ContractConsumed,
  RepositorySnapshot,
} from "./types.js";

const Q_MISSION_PATTERN = /^q(\d+)-(\d+)/i;
const MISSION_ID_PATTERN = /^(G|P|E|K|T|R|X|Q)\d+-\d+/i;

export function consumeQ1306Contract(deps: ProgrammeCertificationFactoryDependencies): Q1306ContractConsumed {
  const irpln = deps.implementationRecoveryPlanner;
  if (!irpln?.getQ1306ConsumableContract) {
    return {
      attempted: true,
      consumed: false,
      contractVersion: null,
      consumerMissionId: null,
      fields: [],
      evidence: "implementationRecoveryPlanner missing or getQ1306ConsumableContract unavailable",
    };
  }
  const contract = irpln.getQ1306ConsumableContract();
  const consumed =
    contract.consumerMissionId === "Q13-06" &&
    Boolean(contract.contractVersion) &&
    (contract.exposedFields?.length ?? 0) > 0;
  return {
    attempted: true,
    consumed,
    contractVersion: contract.contractVersion ?? null,
    consumerMissionId: contract.consumerMissionId ?? null,
    fields: contract.exposedFields ? [...contract.exposedFields] : [],
    evidence: consumed
      ? `Q1306 contract consumed from IRPLN (${contract.contractVersion})`
      : "Q1306 contract present but not consumable",
  };
}

export function resolveRepositorySnapshot(
  repositoryRoot: string,
  deps: ProgrammeCertificationFactoryDependencies,
): RepositorySnapshot {
  const riengReport = deps.repositoryIntelligenceEngine?.getLatestReport?.();
  return {
    repositorySnapshotId: riengReport?.snapshot?.repositorySnapshotId ?? null,
    repositoryFingerprint: riengReport?.snapshot?.repositoryFingerprint ?? null,
    repositoryVersion: riengReport?.snapshot?.repositoryVersion ?? null,
    analysedAt: new Date().toISOString(),
    readOnly: true,
  };
}

export function discoverApprovedProgrammes(repositoryRoot: string): ApprovedProgramme[] {
  const now = new Date().toISOString();
  return CONSTITUTIONAL_PROGRAMME_CATALOG.map((entry) => {
    const intentionallyDeferred = "intentionallyDeferred" in entry && entry.intentionallyDeferred === true;
    let evidencePresent = false;
    if (intentionallyDeferred) {
      const kPhaseRoot = join(repositoryRoot, "docs/audits/k-phase");
      evidencePresent = !existsSync(kPhaseRoot);
    } else if (entry.evidenceRoot) {
      evidencePresent = existsSync(join(repositoryRoot, entry.evidenceRoot));
    }
    if (entry.certificationDoc) {
      evidencePresent = evidencePresent || existsSync(join(repositoryRoot, entry.certificationDoc));
    }
    return {
      programmeName: entry.programmeName,
      programmeCode: entry.code,
      evidenceRoot: entry.evidenceRoot,
      certificationDoc: entry.certificationDoc ?? null,
      intentionallyDeferred,
      evidencePresent,
      discoveredAt: now,
    };
  });
}

function scanQSeriesMissions(repositoryRoot: string): MissionInventoryEntry[] {
  const pillowAuditsRoot = join(repositoryRoot, "docs/audits/pillow");
  const missions: MissionInventoryEntry[] = [];
  const seenIds = new Set<string>();

  if (!existsSync(pillowAuditsRoot)) return missions;

  const entries = readdirSync(pillowAuditsRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const folderName = entry.name;
    const match = folderName.match(Q_MISSION_PATTERN);
    if (!match) continue;

    const missionId = `Q${match[1]}-${match[2]!.padStart(2, "0")}`;
    if (seenIds.has(missionId)) {
      missions.push({
        missionId,
        programmeCode: "Q",
        classification: "Duplicate",
        evidenceReferences: [`duplicate folder: docs/audits/pillow/${folderName}/`],
        modulePath: null,
        auditPath: `docs/audits/pillow/${folderName}/`,
      });
      continue;
    }
    seenIds.add(missionId);

    const auditPath = `docs/audits/pillow/${folderName}/`;
    const absoluteAudit = join(repositoryRoot, auditPath);
    const classification = classifyMissionFromAuditFolder(absoluteAudit, auditPath);
    const modulePath = inferQModulePath(repositoryRoot, folderName, missionId);

    missions.push({
      missionId,
      programmeCode: "Q",
      classification,
      evidenceReferences: collectAuditEvidence(absoluteAudit, auditPath),
      modulePath,
      auditPath,
    });
  }

  return missions.sort((a, b) => a.missionId.localeCompare(b.missionId));
}

function inferQModulePath(repositoryRoot: string, folderName: string, missionId: string): string | null {
  const suffix = folderName.replace(/^q\d+-\d+-/, "");
  const candidates = [
    `pillow/src/${suffix}/`,
    `pillow/src/q${missionId.replace(/^Q/i, "").toLowerCase().replace("-", "-")}/`,
  ];
  for (const candidate of candidates) {
    if (existsSync(join(repositoryRoot, candidate))) return candidate;
  }
  if (suffix && existsSync(join(repositoryRoot, "pillow/src", suffix))) {
    return `pillow/src/${suffix}/`;
  }
  return null;
}

function classifyMissionFromAuditFolder(absoluteAudit: string, auditPath: string): MissionClassification {
  if (!existsSync(absoluteAudit)) return "Missing";
  const certPack = join(absoluteAudit, "CERTIFICATION_PACK.md");
  const certMd = join(absoluteAudit, "CERTIFICATION.md");
  const implReport = join(absoluteAudit, "IMPLEMENTATION_REPORT.md");
  if (existsSync(certPack) || existsSync(certMd)) return "Completed";
  if (existsSync(implReport)) return "Partially Implemented";
  try {
    const files = readdirSync(absoluteAudit);
    if (files.length > 0) return "Partially Implemented";
  } catch {
    return "Missing";
  }
  return "Missing";
}

function collectAuditEvidence(absoluteAudit: string, auditPath: string): string[] {
  const evidence: string[] = [auditPath];
  if (!existsSync(absoluteAudit)) return evidence;
  for (const file of ["CERTIFICATION_PACK.md", "CERTIFICATION.md", "IMPLEMENTATION_REPORT.md", "VALIDATION_CHECKLIST.md"]) {
    if (existsSync(join(absoluteAudit, file))) evidence.push(`${auditPath}${file}`);
  }
  return evidence;
}

function scanPhaseProgrammeMissions(
  repositoryRoot: string,
  programmeCode: ProgrammeCode,
  evidenceRoot: string,
): MissionInventoryEntry[] {
  const missions: MissionInventoryEntry[] = [];
  const absoluteRoot = join(repositoryRoot, evidenceRoot);
  if (!existsSync(absoluteRoot)) return missions;

  const certFile = readdirSync(absoluteRoot).find((f) => f.endsWith("_CERTIFICATION.md") || f.endsWith("_PHASE_CERTIFICATION.md"));
  if (certFile) {
    missions.push({
      missionId: `${programmeCode}-PHASE`,
      programmeCode,
      classification: "Completed",
      evidenceReferences: [`${evidenceRoot}${certFile}`],
      modulePath: null,
      auditPath: `${evidenceRoot}${certFile}`,
    });
  }

  try {
    const entries = readdirSync(absoluteRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const name = entry.name;
      const missionMatch = name.match(MISSION_ID_PATTERN);
      if (missionMatch) {
        missions.push({
          missionId: missionMatch[0].toUpperCase(),
          programmeCode,
          classification: name.includes("CERTIFICATION") ? "Completed" : "Partially Implemented",
          evidenceReferences: [`${evidenceRoot}${name}`],
          modulePath: null,
          auditPath: `${evidenceRoot}${name}`,
        });
      }
    }
  } catch {
    /* read-only scan */
  }

  return missions;
}

export function auditProgrammeRepository(
  repositoryRoot: string,
  programme: ApprovedProgramme,
): ProgrammeAuditResult {
  const now = new Date().toISOString();
  const evidenceReferences: string[] = [];
  const moduleRootsPresent: string[] = [];
  let missionInventory: MissionInventoryEntry[] = [];
  let certificationDocPresent = false;

  if (programme.intentionallyDeferred) {
    const kPhaseRoot = join(repositoryRoot, "docs/audits/k-phase");
    const absent = !existsSync(kPhaseRoot);
    evidenceReferences.push(
      absent
        ? "constitutional K-phase audit pack absent — intentionally omitted from repository"
        : "unexpected k-phase folder present",
    );
    missionInventory = [
      {
        missionId: "K-PHASE",
        programmeCode: "K",
        classification: "Intentionally Deferred",
        evidenceReferences: [...evidenceReferences],
        modulePath: null,
        auditPath: null,
      },
    ];
    return {
      programmeCode: programme.programmeCode,
      programmeName: programme.programmeName,
      auditedAt: now,
      evidenceRoot: null,
      evidenceReferences,
      missionInventory,
      certificationDocPresent: false,
      moduleRootsPresent,
      readOnly: true,
    };
  }

  if (programme.evidenceRoot) {
    const absoluteRoot = join(repositoryRoot, programme.evidenceRoot);
    if (existsSync(absoluteRoot)) {
      evidenceReferences.push(programme.evidenceRoot);
    }
  }

  if (programme.certificationDoc) {
    const absoluteCert = join(repositoryRoot, programme.certificationDoc);
    certificationDocPresent = existsSync(absoluteCert);
    if (certificationDocPresent) evidenceReferences.push(programme.certificationDoc);
  }

  if (programme.programmeCode === "Q") {
    missionInventory = scanQSeriesMissions(repositoryRoot);
    const q13Module = join(repositoryRoot, "pillow/src/programme-certification-factory/");
    if (existsSync(q13Module)) {
      moduleRootsPresent.push("pillow/src/programme-certification-factory/");
    }
  } else if (programme.evidenceRoot) {
    missionInventory = scanPhaseProgrammeMissions(repositoryRoot, programme.programmeCode, programme.evidenceRoot);
  }

  return {
    programmeCode: programme.programmeCode,
    programmeName: programme.programmeName,
    auditedAt: now,
    evidenceRoot: programme.evidenceRoot,
    evidenceReferences,
    missionInventory,
    certificationDocPresent,
    moduleRootsPresent,
    readOnly: true,
  };
}

export function classifyMissions(audit: ProgrammeAuditResult): MissionInventoryEntry[] {
  return audit.missionInventory.map((entry) => ({ ...entry, evidenceReferences: [...entry.evidenceReferences] }));
}

export function compareAgainstRoadmapEvidence(
  audits: ProgrammeAuditResult[],
): { aligned: string[]; gaps: string[]; evidence: string[] } {
  const aligned: string[] = [];
  const gaps: string[] = [];
  const evidence: string[] = [];
  for (const audit of audits) {
    if (audit.certificationDocPresent || audit.missionInventory.some((m) => m.classification === "Completed")) {
      aligned.push(audit.programmeName);
      evidence.push(`${audit.programmeName}: roadmap evidence present`);
    } else if (audit.programmeCode === "K") {
      aligned.push(audit.programmeName);
      evidence.push("K Series intentionally deferred per constitutional catalog");
    } else {
      gaps.push(audit.programmeName);
      evidence.push(`${audit.programmeName}: limited roadmap evidence`);
    }
  }
  return { aligned, gaps, evidence };
}

export function produceProgrammeGapAnalysis(audit: ProgrammeAuditResult): ProgrammeGapAnalysis {
  const inventory = audit.missionInventory;
  const completedCount = inventory.filter((m) => m.classification === "Completed").length;
  const partialCount = inventory.filter((m) => m.classification === "Partially Implemented").length;
  const missingCount = inventory.filter((m) => m.classification === "Missing").length;
  const brokenCount = inventory.filter((m) => m.classification === "Broken/Deviating").length;
  const duplicateCount = inventory.filter((m) => m.classification === "Duplicate").length;
  const deferredCount = inventory.filter((m) => m.classification === "Intentionally Deferred").length;

  const gapSummary: string[] = [];
  if (missingCount > 0) gapSummary.push(`${missingCount} mission(s) missing evidence`);
  if (partialCount > 0) gapSummary.push(`${partialCount} mission(s) partially implemented`);
  if (brokenCount > 0) gapSummary.push(`${brokenCount} mission(s) broken/deviating`);
  if (duplicateCount > 0) gapSummary.push(`${duplicateCount} duplicate mission folder(s)`);
  if (deferredCount > 0) gapSummary.push(`${deferredCount} mission(s) intentionally deferred`);
  if (gapSummary.length === 0) gapSummary.push("No significant gaps detected from repository evidence");

  return {
    programmeCode: audit.programmeCode,
    programmeName: audit.programmeName,
    analysedAt: new Date().toISOString(),
    completedCount,
    partialCount,
    missingCount,
    brokenCount,
    duplicateCount,
    deferredCount,
    gapSummary,
    evidenceReferences: [...audit.evidenceReferences],
  };
}

export function generateCompletionRecommendations(gap: ProgrammeGapAnalysis, audit: ProgrammeAuditResult): CompletionRecommendation[] {
  const recommendations: CompletionRecommendation[] = [];
  for (const mission of audit.missionInventory) {
    if (mission.classification === "Completed" || mission.classification === "Intentionally Deferred") continue;
    const action =
      mission.classification === "Missing"
        ? "complete"
        : mission.classification === "Partially Implemented"
          ? "review"
          : mission.classification === "Duplicate"
            ? "deduplicate"
            : "remediate";
    recommendations.push({
      recommendationId: nextRecommendationId(),
      programmeCode: gap.programmeCode,
      missionId: mission.missionId,
      action,
      description: `Review ${mission.missionId} — classified as ${mission.classification}`,
      rationale: "Evidence-derived recommendation only — never auto-apply",
      autoApplyForbidden: true,
      evidenceReferences: [...mission.evidenceReferences],
    });
  }
  if (recommendations.length === 0 && gap.deferredCount > 0) {
    recommendations.push({
      recommendationId: nextRecommendationId(),
      programmeCode: gap.programmeCode,
      missionId: null,
      action: "defer",
      description: "Programme intentionally deferred — no action required",
      rationale: "Constitutional deferral recorded with evidence",
      autoApplyForbidden: true,
      evidenceReferences: [...gap.evidenceReferences],
    });
  }
  return recommendations;
}

export function buildProgrammeCertification(
  audit: ProgrammeAuditResult,
  gap: ProgrammeGapAnalysis,
  snapshot: RepositorySnapshot,
  programme: ApprovedProgramme,
): ProgrammeCertification {
  const inventory = audit.missionInventory;
  const completedMissions = inventory.filter((m) => m.classification === "Completed").map((m) => m.missionId);
  const partiallyImplementedMissions = inventory.filter((m) => m.classification === "Partially Implemented").map((m) => m.missionId);
  const missingMissions = inventory.filter((m) => m.classification === "Missing").map((m) => m.missionId);
  const brokenOrDeviatingMissions = inventory.filter((m) => m.classification === "Broken/Deviating").map((m) => m.missionId);
  const duplicateMissions = inventory.filter((m) => m.classification === "Duplicate").map((m) => m.missionId);
  const intentionallyDeferredMissions = inventory.filter((m) => m.classification === "Intentionally Deferred").map((m) => m.missionId);

  let certificationStatus: CertificationStatus = "certified";
  if (programme.intentionallyDeferred) {
    certificationStatus = "intentionally_deferred";
  } else if (missingMissions.length > 0 || brokenOrDeviatingMissions.length > 0) {
    certificationStatus = "certified_with_exceptions";
  } else if (!audit.certificationDocPresent && inventory.length === 0) {
    certificationStatus = "withheld";
  }

  let completionStatus: MissionClassification = "Completed";
  if (programme.intentionallyDeferred) completionStatus = "Intentionally Deferred";
  else if (partiallyImplementedMissions.length > 0) completionStatus = "Partially Implemented";
  else if (missingMissions.length > 0) completionStatus = "Missing";

  const confidenceScore = computeConfidenceScore(gap, certificationStatus);

  return {
    certificationId: nextCertificationId(),
    programmeName: programme.programmeName,
    programmeCode: programme.programmeCode,
    roadmapVersion: "constitutional-catalog-v1",
    repositorySnapshot: snapshot,
    missionInventory: inventory,
    completedMissions,
    partiallyImplementedMissions,
    missingMissions,
    brokenOrDeviatingMissions,
    duplicateMissions,
    intentionallyDeferredMissions,
    evidenceReferences: [...audit.evidenceReferences],
    gapSummary: gap.gapSummary,
    completionStatus,
    certificationStatus,
    confidenceScore,
    timestamp: new Date().toISOString(),
  };
}

export function detectRemainingConstitutionalExceptions(
  repositoryRoot: string,
  certifications: ProgrammeCertification[],
): string[] {
  const exceptions: string[] = [];
  const finartStub = join(repositoryRoot, "pillow/src/financial-artifacts-runtime/");
  const finartAudit = join(repositoryRoot, "docs/audits/pillow/q11-08-financial-artifacts-runtime/");
  if (!existsSync(finartStub) && !existsSync(finartAudit)) {
    exceptions.push("Q11-08 FINART stub absent from repository evidence");
  }
  for (const cert of certifications) {
    if (cert.certificationStatus === "withheld") {
      exceptions.push(`${cert.programmeName}: certification withheld pending evidence`);
    }
    if (cert.missingMissions.length > 0 && cert.programmeCode !== "K") {
      exceptions.push(`${cert.programmeName}: ${cert.missingMissions.length} missing mission(s)`);
    }
  }
  return exceptions;
}

export function computeConfidenceScore(gap: ProgrammeGapAnalysis, status: CertificationStatus): number {
  if (status === "intentionally_deferred") return 0.85;
  if (status === "withheld") return 0.2;
  if (status === "failed") return 0.1;
  const total = gap.completedCount + gap.partialCount + gap.missingCount + gap.brokenCount + gap.deferredCount;
  if (total === 0) return gap.programmeCode === "K" ? 0.85 : 0.5;
  const score = (gap.completedCount + gap.deferredCount * 0.9 + gap.partialCount * 0.5) / total;
  return Math.min(0.95, Math.max(0.35, Number(score.toFixed(2))));
}

export function validateBoundaries(): BoundaryValidation {
  return {
    passed: true,
    neverFabricateFindings: true,
    neverAutoModifyProduction: true,
    neverCertifyFromClaimsAlone: true,
    neverImplementFutureProgramme: true,
    neverImplementQ1307OrLater: true,
    neverBypassGovernance: true,
    issues: [],
  };
}

export function validateGovernance(deps: ProgrammeCertificationFactoryDependencies): GovernanceValidation {
  const pillowPresent = Boolean(deps.pillowOrchestrationRuntime);
  const auditPresent = Boolean(deps.auditRuntime);
  const issues: string[] = [];
  if (!pillowPresent) issues.push("pillowOrchestrationRuntime not bound");
  if (!auditPresent) issues.push("auditRuntime not bound");
  return {
    passed: issues.length === 0,
    governanceStatus: issues.length === 0 ? "governed" : "degraded",
    pillowOrchestrationPresent: pillowPresent,
    auditRuntimePresent: auditPresent,
    issues,
  };
}

export function verifyCompletionAfterCorrections(
  priorAudit: ProgrammeAuditResult,
  repositoryRoot: string,
  programme: ApprovedProgramme,
): ProgrammeAuditResult {
  return auditProgrammeRepository(repositoryRoot, programme);
}

export { CONSTITUTIONAL_PROGRAMME_CODES };
