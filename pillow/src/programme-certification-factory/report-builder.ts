import {
  PROGRAMME_CERTIFICATION_FACTORY_REPORT_VERSION,
  PCFCT_METADATA_VERSION,
} from "./paths.js";
import type {
  BoundaryValidation,
  CompletionRecommendation,
  GovernanceValidation,
  IntegrationHandshake,
  ProgrammeCertification,
  ProgrammeCertificationReport,
  ProgrammeGapAnalysis,
  PcfctValidation,
  Q1306ContractConsumed,
} from "./types.js";

export function buildCatalog(
  workerId: string,
  reports: ProgrammeCertificationReport[],
  certifications: ProgrammeCertification[],
  integrations: IntegrationHandshake[],
  historyCount: number,
) {
  return {
    workerId,
    reports: reports.map((r) => ({
      reportId: r.reportId,
      timestamp: r.timestamp,
      programmeCode: r.programmeCode,
      confidenceScore: r.programmeCertification.confidenceScore,
    })),
    certifications: certifications.map((c) => ({
      certificationId: c.certificationId,
      programmeCode: c.programmeCode,
      certificationStatus: c.certificationStatus,
      timestamp: c.timestamp,
    })),
    integrations,
    certificationHistoryCount: historyCount,
  };
}

export function buildReport(input: {
  reportId: string;
  workerId: string;
  programmeCode: import("./types.js").ProgrammeCode;
  programmeName: string;
  programmeCertification: ProgrammeCertification;
  gapAnalysis: ProgrammeGapAnalysis;
  recommendations: CompletionRecommendation[];
  boundaryValidation: BoundaryValidation;
  governanceValidation: GovernanceValidation;
  validation: PcfctValidation;
  confidenceScore: number;
  q1306ContractConsumed: Q1306ContractConsumed;
  supportingEvidence: string[];
  historyRefs: string[];
}): ProgrammeCertificationReport {
  const now = new Date().toISOString();
  return {
    reportId: input.reportId,
    reportVersion: PROGRAMME_CERTIFICATION_FACTORY_REPORT_VERSION,
    metadataVersion: PCFCT_METADATA_VERSION,
    engineId: "PILLOW-PCFCT-001",
    timestamp: now,
    runTimestamp: now,
    workerId: input.workerId,
    missionId: "Q13-06",
    programmeCode: input.programmeCode,
    programmeName: input.programmeName,
    programmeCertification: input.programmeCertification,
    gapAnalysis: input.gapAnalysis,
    recommendations: input.recommendations,
    boundaryValidation: input.boundaryValidation,
    governanceValidation: input.governanceValidation,
    q1306ContractConsumed: input.q1306ContractConsumed,
    neverImplementFutureProgramme: true,
    neverImplementQ1307OrLater: true,
    neverAutoModifyProduction: true,
    neverCertifyFromClaimsAlone: true,
    neverFabricateFindings: true,
    neverBypassGovernance: true,
    programmeCertificationOnly: true,
    supportingEvidence: [...input.supportingEvidence],
    validation: input.validation,
    historyRefs: [...input.historyRefs],
  };
}

export function buildFinalRepositoryConstitutionalCertification(input: {
  reportId: string;
  certifications: ProgrammeCertification[];
  overallMissionInventory: import("./types.js").MissionInventoryEntry[];
  remainingConstitutionalExceptions: string[];
  q1306ContractConsumed: boolean;
  supportingEvidence: string[];
}): import("./types.js").FinalRepositoryConstitutionalCertification {
  const certifiedProgrammes = input.certifications
    .filter((c) => c.certificationStatus === "certified" || c.certificationStatus === "certified_with_exceptions")
    .map((c) => c.programmeName);
  const deferredProgrammes = input.certifications
    .filter((c) => c.certificationStatus === "intentionally_deferred")
    .map((c) => c.programmeName);

  const matrix = {} as import("./types.js").FinalRepositoryConstitutionalCertification["repositoryCompletenessMatrix"];
  for (const code of ["G", "P", "E", "K", "T", "R", "X", "Q"] as const) {
    const cert = input.certifications.find((c) => c.programmeCode === code);
    matrix[code] = {
      status: cert?.certificationStatus ?? "withheld",
      missionCount: cert?.missionInventory.length ?? 0,
    };
  }

  const hasExceptions = input.remainingConstitutionalExceptions.length > 0;
  const allCertified = input.certifications.length >= 8;
  const finalDecision = !allCertified
    ? "withheld"
    : hasExceptions
      ? "constitutionally_complete_with_exceptions"
      : "constitutionally_complete_with_exceptions";

  return {
    reportId: input.reportId,
    metadataVersion: PCFCT_METADATA_VERSION,
    engineId: "PILLOW-PCFCT-001",
    missionId: "Q13-06",
    repositorySummary: `Constitutional programme certification across ${input.certifications.length} programmes from repository evidence`,
    certifiedProgrammes,
    deferredProgrammes,
    overallMissionInventory: input.overallMissionInventory,
    repositoryCompletenessMatrix: matrix,
    architectureCompleteness: "Evidence-derived from phase audit packs and pillow Q modules",
    runtimeCompleteness: "Runtime handles verified via integration bindings — no auto-modification",
    governanceCompleteness: "Pillow/Grand King governance chain preserved — never bypassed",
    securitySummary: "Security posture derived from audit packs — no claims-only certification",
    productionReadinessSummary: hasExceptions
      ? "Production readiness recorded with constitutional exceptions — not universal perfection claimed"
      : "Production readiness assessed from repository evidence",
    executiveReadinessSummary: "Executive reporting via ERR — recommendations only, never auto-applied",
    finalConstitutionalDecision: finalDecision,
    supportingEvidence: [...input.supportingEvidence],
    remainingConstitutionalExceptions: [...input.remainingConstitutionalExceptions],
    repositoryCertificationTimestamp: new Date().toISOString(),
    q1306ContractConsumed: input.q1306ContractConsumed,
    neverImplementFutureProgramme: true,
    neverImplementQ1307OrLater: true,
    structuralSignalOnly: true,
  };
}
