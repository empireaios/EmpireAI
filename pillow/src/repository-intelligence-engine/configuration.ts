import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_EXCLUDE_DIRS,
  DEFAULT_INCLUDE_ROOTS,
  REPOSITORY_INTELLIGENCE_ENGINE_IDENTITY,
  RIENG_METADATA_VERSION,
} from "./paths.js";
import type { RepositoryIntelligenceReport } from "./types.js";

export type RepositoryIntelligenceEngineConfiguration = {
  enabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: RepositoryIntelligenceReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  includeRoots: string[];
  excludeDirs: string[];
  maxDepth: number;
  maxFiles: number;
  oversizedFileLines: number;
  oversizedModuleFiles: number;
  /** Q13-02 hard boundaries — force-locked true. */
  neverModifyAnalyzedFiles: true;
  neverImplementQ1303OrLater: true;
  neverCertifyQ1301: true;
  preserveCompleteTraceability: true;
  preserveRepositoryKnowledgeHistory: true;
  preserveAuditHistory: true;
  deterministicRepositoryAnalysis: true;
  evidenceBasedOnly: true;
  readOnlyRepositoryAnalysis: true;
  maskSensitiveValues: true;
};

export const DEFAULT_REPOSITORY_INTELLIGENCE_ENGINE_CONFIGURATION: RepositoryIntelligenceEngineConfiguration =
  {
    enabled: true,
    executiveReportingEnabled: true,
    integrationTargets: [
      "ai_innovation_factory",
      "implementation_specification_engine",
      "intelligence_context",
      "audit_runtime",
      "executive_reporting_runtime",
      "pillow_orchestration_runtime",
      "empire_knowledge_engine",
      "monitoring_runtime",
    ],
    workerId: REPOSITORY_INTELLIGENCE_ENGINE_IDENTITY.workerId,
    workerName: REPOSITORY_INTELLIGENCE_ENGINE_IDENTITY.workerName,
    factory: REPOSITORY_INTELLIGENCE_ENGINE_IDENTITY.factory,
    department: REPOSITORY_INTELLIGENCE_ENGINE_IDENTITY.department,
    role: REPOSITORY_INTELLIGENCE_ENGINE_IDENTITY.role,
    reportingLine: [...REPOSITORY_INTELLIGENCE_ENGINE_IDENTITY.reportingLine],
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 30000,
    loggingLevel: "info",
    includeRoots: [...DEFAULT_INCLUDE_ROOTS],
    excludeDirs: [...DEFAULT_EXCLUDE_DIRS],
    maxDepth: 12,
    maxFiles: 50000,
    oversizedFileLines: 800,
    oversizedModuleFiles: 40,
    neverModifyAnalyzedFiles: true,
    neverImplementQ1303OrLater: true,
    neverCertifyQ1301: true,
    preserveCompleteTraceability: true,
    preserveRepositoryKnowledgeHistory: true,
    preserveAuditHistory: true,
    deterministicRepositoryAnalysis: true,
    evidenceBasedOnly: true,
    readOnlyRepositoryAnalysis: true,
    maskSensitiveValues: true,
  };

function resolveIncludeRoots(repositoryRoot: string, roots: string[]): string[] {
  const resolved = roots.filter((root) => existsSync(join(repositoryRoot, root)));
  if (resolved.length > 0) return resolved;
  return roots.slice(0, 1);
}

export function buildRepositoryIntelligenceEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RepositoryIntelligenceEngineConfiguration> = {},
): RepositoryIntelligenceEngineConfiguration {
  let file: Partial<RepositoryIntelligenceEngineConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "repository-intelligence-engine.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }

  const timeout = Number.parseInt(process.env.REPOSITORY_INTELLIGENCE_ENGINE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.REPOSITORY_INTELLIGENCE_ENGINE_RETRY_ATTEMPTS ?? "", 10);
  const maxDepth = Number.parseInt(process.env.REPOSITORY_INTELLIGENCE_ENGINE_MAX_DEPTH ?? "", 10);
  const maxFiles = Number.parseInt(process.env.REPOSITORY_INTELLIGENCE_ENGINE_MAX_FILES ?? "", 10);

  const includeRoots = resolveIncludeRoots(
    repositoryRoot ?? "",
    overrides.includeRoots ?? file.includeRoots ?? DEFAULT_REPOSITORY_INTELLIGENCE_ENGINE_CONFIGURATION.includeRoots,
  );

  return {
    ...DEFAULT_REPOSITORY_INTELLIGENCE_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    includeRoots,
    excludeDirs: Array.from(
      new Set([
        ...DEFAULT_REPOSITORY_INTELLIGENCE_ENGINE_CONFIGURATION.excludeDirs,
        ...((file.excludeDirs as string[] | undefined) ?? []),
        ...((overrides.excludeDirs as string[] | undefined) ?? []),
      ]),
    ),
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_REPOSITORY_INTELLIGENCE_ENGINE_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_REPOSITORY_INTELLIGENCE_ENGINE_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(maxDepth) && maxDepth > 0 ? { maxDepth } : {}),
    ...(Number.isFinite(maxFiles) && maxFiles > 0 ? { maxFiles } : {}),
    neverModifyAnalyzedFiles: true,
    neverImplementQ1303OrLater: true,
    neverCertifyQ1301: true,
    preserveCompleteTraceability: true,
    preserveRepositoryKnowledgeHistory: true,
    preserveAuditHistory: true,
    deterministicRepositoryAnalysis: true,
    evidenceBasedOnly: true,
    readOnlyRepositoryAnalysis: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: RepositoryIntelligenceReport): RepositoryIntelligenceReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    historyRefs: [...report.historyRefs],
    metadataVersion: report.metadataVersion || RIENG_METADATA_VERSION,
    neverImplementQ1303OrLater: true,
    neverModifyAnalyzedFiles: true,
    preserveCompleteTraceability: true,
    preserveRepositoryKnowledgeHistory: true,
    deterministicRepositoryAnalysis: true,
    evidenceBasedOnly: true,
  };
}
