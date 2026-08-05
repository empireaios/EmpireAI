import {
  REPOSITORY_INTELLIGENCE_ENGINE_REPORT_VERSION,
  RIENG_METADATA_VERSION,
} from "./paths.js";
import type {
  Q1301ContractObservation,
  Q1302ContractConsumed,
  Q1302Prerequisite,
  Q1301MissionPrerequisite,
  RepositoryIntelligenceReport,
  RepositoryIntelligenceSnapshot,
  RepositorySummary,
  RiengValidation,
} from "./types.js";

export function buildReport(params: {
  reportId: string;
  workerId: string;
  snapshot: RepositoryIntelligenceSnapshot;
  includeRoots: string[];
  excludeDirs: string[];
  validation: RiengValidation;
  confidenceScore: number;
  q1302ContractConsumed: Q1302ContractConsumed;
  q1302Prerequisite: Q1302Prerequisite;
  q1301Observation: Q1301ContractObservation;
  /** @deprecated retained for backward compatibility */
  q1301ContractConsumed?: Q1301ContractObservation;
  /** @deprecated retained for backward compatibility */
  q1301MissionPrerequisite?: Q1301MissionPrerequisite;
  supportingEvidence: string[];
  outstandingIssues: string[];
  historyRefs: string[];
}): RepositoryIntelligenceReport {
  const {
    reportId,
    workerId,
    snapshot,
    includeRoots,
    excludeDirs,
    validation,
    confidenceScore,
    q1302ContractConsumed,
    q1302Prerequisite,
    q1301Observation,
    supportingEvidence,
    outstandingIssues,
    historyRefs,
  } = params;

  const legacyPrerequisite: Q1301MissionPrerequisite = {
    ...q1302Prerequisite,
    q1301MissionPresent: q1302Prerequisite.implementationSpecificationEnginePresent,
  };

  const repositorySummary: RepositorySummary = {
    totalFiles: snapshot.moduleInventory.reduce((sum, module) => sum + module.fileCount, 0),
    totalModules: snapshot.moduleInventory.length,
    totalServices: snapshot.serviceInventory.length,
    includeRoots,
    excludeDirs,
    repositoryFingerprint: snapshot.repositoryFingerprint,
    repositoryVersion: snapshot.repositoryVersion,
  };

  const serviceByKind: Record<string, number> = {};
  for (const service of snapshot.serviceInventory) {
    serviceByKind[service.kind] = (serviceByKind[service.kind] ?? 0) + 1;
  }

  const debtByCategory: Record<string, number> = {};
  for (const debt of snapshot.technicalDebtFindings) {
    debtByCategory[debt.category] = (debtByCategory[debt.category] ?? 0) + 1;
  }

  const violationCount = snapshot.architectureLayers.reduce((sum, layer) => sum + layer.violations.length, 0);
  const timestamp = new Date().toISOString();

  return {
    reportId,
    reportVersion: REPOSITORY_INTELLIGENCE_ENGINE_REPORT_VERSION,
    metadataVersion: RIENG_METADATA_VERSION,
    timestamp,
    runTimestamp: timestamp,
    workerId,
    missionId: "Q13-02",
    repositorySummary,
    moduleSummary: {
      totalModules: snapshot.moduleInventory.length,
      topModules: snapshot.moduleInventory.slice(0, 10).map((module) => ({ ...module, evidencePaths: [...module.evidencePaths] })),
    },
    serviceSummary: {
      totalServices: snapshot.serviceInventory.length,
      byKind: serviceByKind,
    },
    dependencySummary: {
      nodeCount: snapshot.dependencyGraph.nodes.length,
      edgeCount: snapshot.dependencyGraph.edges.length,
      cycleCount: snapshot.dependencyGraph.cycles.length,
      unresolvedCount: snapshot.dependencyGraph.unresolvedCount,
    },
    architectureSummary: {
      layers: snapshot.architectureLayers.map((layer) => ({
        ...layer,
        constraints: [...layer.constraints],
        violations: [...layer.violations],
        evidencePaths: [...layer.evidencePaths],
      })),
      violationCount,
    },
    existingImplementationSummary: {
      count: snapshot.existingImplementations.length,
      entries: snapshot.existingImplementations.slice(0, 20).map((entry) => ({
        ...entry,
        paths: [...entry.paths],
        evidence: [...entry.evidence],
      })),
    },
    technicalDebtSummary: {
      count: snapshot.technicalDebtFindings.length,
      byCategory: debtByCategory,
    },
    riskSummary: {
      count: snapshot.risks.length,
      risks: snapshot.risks.map((risk) => ({ ...risk, evidence: [...risk.evidence] })),
    },
    confidenceScore,
    snapshot: JSON.parse(JSON.stringify(snapshot)) as RepositoryIntelligenceSnapshot,
    supportingEvidence: [...supportingEvidence],
    outstandingIssues: [...outstandingIssues],
    traceabilityRefs: [`q13-02:repository-intelligence-engine`, `report:${reportId}`, `fingerprint:${snapshot.repositoryFingerprint}`],
    q1302ContractConsumed,
    q1302Prerequisite,
    q1301Observation,
    q1301ContractConsumed: q1301Observation,
    q1301MissionPrerequisite: legacyPrerequisite,
    consumableByQ1303: validation.decision !== "failed",
    neverImplementQ1303OrLater: true,
    neverModifyAnalyzedFiles: true,
    preserveCompleteTraceability: true,
    preserveRepositoryKnowledgeHistory: true,
    deterministicRepositoryAnalysis: true,
    evidenceBasedOnly: true,
    validation,
    historyRefs: [...historyRefs],
  };
}

export function buildCatalog(
  workerId: string,
  reports: RepositoryIntelligenceReport[],
  integrations: import("./types.js").IntegrationHandshake[],
  knowledgeHistoryCount: number,
) {
  return {
    workerId,
    reports: reports.map((report) => ({ reportId: report.reportId, timestamp: report.timestamp, confidenceScore: report.confidenceScore })),
    integrations: integrations.map((handshake) => ({ ...handshake })),
    knowledgeHistoryCount,
  };
}
