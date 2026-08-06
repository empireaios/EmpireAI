import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EESAE_IDENTITY, EESAE_METADATA_VERSION } from "./paths.js";
import type { SituationalAwarenessReport } from "./types.js";

export type EnterpriseExecutiveSituationalAwarenessEngineConfiguration = {
  enabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  repositoryRoot: string;
  seedReports: SituationalAwarenessReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverFabricateMetrics: true;
  neverSilentDeterioration: true;
  neverAutoModifyProduction: true;
  neverBypassGovernance: true;
  preserveAwarenessHistory: true;
  preserveAuditHistory: true;
  constitutionalDutyActive: true;
  maskSensitiveValues: boolean;
};

export const DEFAULT_EESAE_CONFIGURATION: EnterpriseExecutiveSituationalAwarenessEngineConfiguration = {
  enabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [
    "monitoring_runtime",
    "executive_reporting_runtime",
    "audit_runtime",
    "pillow_orchestration_runtime",
    "digital_soul_runtime",
    "worker_registry",
    "commerce_intelligence",
    "empire_knowledge_engine",
    "programme_certification_factory",
    "queue_runtime",
    "memory_runtime",
    "recovery_runtime",
    "shared_runtime_core",
    "intelligence_context",
  ],
  workerId: EESAE_IDENTITY.workerId,
  workerName: EESAE_IDENTITY.workerName,
  factory: EESAE_IDENTITY.factory,
  department: EESAE_IDENTITY.department,
  role: EESAE_IDENTITY.role,
  reportingLine: [...EESAE_IDENTITY.reportingLine],
  repositoryRoot: "",
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 30000,
  loggingLevel: "info",
  neverFabricateMetrics: true,
  neverSilentDeterioration: true,
  neverAutoModifyProduction: true,
  neverBypassGovernance: true,
  preserveAwarenessHistory: true,
  preserveAuditHistory: true,
  constitutionalDutyActive: true,
  maskSensitiveValues: true,
};

export function buildEnterpriseExecutiveSituationalAwarenessEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EnterpriseExecutiveSituationalAwarenessEngineConfiguration> = {},
): EnterpriseExecutiveSituationalAwarenessEngineConfiguration {
  let file: Partial<EnterpriseExecutiveSituationalAwarenessEngineConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "enterprise-executive-situational-awareness-engine.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }

  const timeout = Number.parseInt(process.env.EESAE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.EESAE_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_EESAE_CONFIGURATION,
    ...file,
    ...overrides,
    repositoryRoot: repositoryRoot ?? overrides.repositoryRoot ?? file.repositoryRoot ?? "",
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_EESAE_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_EESAE_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateMetrics: true,
    neverSilentDeterioration: true,
    neverAutoModifyProduction: true,
    neverBypassGovernance: true,
    preserveAwarenessHistory: true,
    preserveAuditHistory: true,
    constitutionalDutyActive: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: SituationalAwarenessReport): SituationalAwarenessReport {
  return {
    ...report,
    historyRefs: [...report.historyRefs],
    findings: report.findings.map((f) => ({ ...f, evidence: [...f.evidence] })),
    recommendations: report.recommendations.map((r) => ({ ...r, evidenceRefs: [...r.evidenceRefs] })),
    domainSummaries: report.domainSummaries.map((d) => ({ ...d, evidenceRefs: [...d.evidenceRefs], notes: [...d.notes] })),
    metadataVersion: report.metadataVersion || EESAE_METADATA_VERSION,
    neverFabricateMetrics: true,
    neverSilentDeterioration: true,
    constitutionalDutyActive: true,
  };
}
