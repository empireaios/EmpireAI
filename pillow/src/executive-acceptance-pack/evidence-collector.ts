import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  AUDIT_SOURCES,
  CERTIFICATION_SOURCES,
  READINESS_EVIDENCE_SOURCES,
} from "./paths.js";
import type {
  AuditEngineHandle,
  ExecutiveAcceptancePackDependencies,
  ProductionCertificationCoreHandle,
  SharedRuntimeCertificationHandle,
} from "./integrations.js";
import type {
  AuditReportRef,
  AuditSource,
  CertificationReportRef,
  CertificationSource,
  ProductionReadinessEvidenceRef,
  ReadinessClassification,
  ReadinessDecision,
  ReadinessEvidenceSource,
} from "./types.js";

type ReportLike = {
  reportId?: string;
  decision?: string;
  auditStatus?: string;
  missionId?: string;
};

function classifyFromReport(
  report: ReportLike | null,
  bound: boolean,
): ReadinessClassification {
  if (!bound) return "missing";
  if (!report) return "missing";
  const status = (report.auditStatus ?? report.decision ?? "").toLowerCase();
  if (status.includes("fail")) return "failed";
  if (status.includes("partial")) return "partially_certified";
  if (status.includes("block")) return "blocked";
  if (status.includes("defer")) return "deferred";
  if (status.includes("certify") || status.includes("certified") || status.includes("pass")) {
    return "certified";
  }
  return "partially_certified";
}

function decisionFromReport(report: ReportLike | null, bound: boolean): ReadinessDecision | null {
  if (!bound || !report?.decision) return null;
  const d = report.decision.toLowerCase();
  if (d === "certify" || d === "withhold" || d === "escalate" || d === "defer") {
    return d as ReadinessDecision;
  }
  return null;
}

function extractLatestReport(handle: AuditEngineHandle | ProductionCertificationCoreHandle | SharedRuntimeCertificationHandle | null | undefined): ReportLike | null {
  if (!handle) return null;
  if (typeof handle.getLatestReport === "function") {
    try {
      const latest = handle.getLatestReport() as ReportLike | null;
      if (latest) return latest;
    } catch {
      /* fall through */
    }
  }
  if (typeof handle.getState === "function") {
    try {
      const state = handle.getState() as { latestReport?: ReportLike | null };
      if (state?.latestReport) return state.latestReport;
    } catch {
      /* fall through */
    }
  }
  if (typeof handle.getReports === "function") {
    try {
      const reports = handle.getReports() ?? [];
      return reports.length ? (reports[reports.length - 1] as ReportLike) : null;
    } catch {
      /* fall through */
    }
  }
  return null;
}

function summarizeRefs<T extends { classification: ReadinessClassification }>(refs: T[]) {
  return {
    certifiedCount: refs.filter((r) => r.classification === "certified").length,
    partiallyCertifiedCount: refs.filter((r) => r.classification === "partially_certified").length,
    failedCount: refs.filter((r) => r.classification === "failed").length,
    missingCount: refs.filter((r) => r.classification === "missing").length,
    blockedCount: refs.filter((r) => r.classification === "blocked").length,
    deferredCount: refs.filter((r) => r.classification === "deferred").length,
    boundCount: refs.filter((r) => (r as { bound?: boolean }).bound !== false).length,
  };
}

export function collectCertificationReports(deps: ExecutiveAcceptancePackDependencies) {
  const now = new Date().toISOString();
  const sourceMap: Record<
    CertificationSource,
    ProductionCertificationCoreHandle | SharedRuntimeCertificationHandle | null | undefined
  > = {
    "production-certification-core": deps.productionCertificationCore,
    "shared-runtime-certification": deps.sharedRuntimeCertification,
  };

  const reports: CertificationReportRef[] = CERTIFICATION_SOURCES.map((source) => {
    const handle = sourceMap[source];
    const bound = !!handle;
    const latest = extractLatestReport(handle);
    const classification = classifyFromReport(latest, bound);
    return {
      source,
      bound,
      reportId: latest?.reportId ?? null,
      decision: decisionFromReport(latest, bound),
      classification,
      evidence: bound
        ? [`${source}: handle bound`, latest?.reportId ? `reportId=${latest.reportId}` : "no report yet"]
        : [`${source}: not injected`],
    };
  });

  const counts = summarizeRefs(reports);
  return {
    computedAt: now,
    totalSources: CERTIFICATION_SOURCES.length,
    ...counts,
    reports,
    evidence: reports.flatMap((r) => r.evidence),
  };
}

const AUDIT_HANDLE_MAP: Record<
  AuditSource,
  (deps: ExecutiveAcceptancePackDependencies) => AuditEngineHandle | null | undefined
> = {
  "worker-readiness-audit": (d) => d.workerReadinessAudit,
  "pillow-command-audit": (d) => d.pillowCommandAudit,
  "business-factory-audit": (d) => d.businessFactoryAudit,
  "security-audit": (d) => d.securityAudit,
  "performance-audit": (d) => d.performanceAudit,
  "recovery-audit": (d) => d.recoveryAudit,
  "financial-readiness-audit": (d) => d.financialReadinessAudit,
};

export function collectAuditReports(deps: ExecutiveAcceptancePackDependencies) {
  const now = new Date().toISOString();
  const reports: AuditReportRef[] = AUDIT_SOURCES.map((source) => {
    const handle = AUDIT_HANDLE_MAP[source](deps);
    const bound = !!handle;
    const latest = extractLatestReport(handle);
    const classification = classifyFromReport(latest, bound);
    const evidence =
      source === "financial-readiness-audit" && !bound
        ? ["Q11-08 Financial Readiness Audit not implemented / not injected"]
        : bound
          ? [
              `${source}: handle bound`,
              latest?.reportId ? `reportId=${latest.reportId}` : "no report yet",
            ]
          : [`${source}: not injected`];
    return {
      source,
      bound,
      reportId: latest?.reportId ?? null,
      decision: decisionFromReport(latest, bound),
      classification,
      missionId: latest?.missionId ?? null,
      evidence,
    };
  });

  const counts = summarizeRefs(reports);
  return {
    computedAt: now,
    totalSources: AUDIT_SOURCES.length,
    ...counts,
    reports,
    evidence: reports.flatMap((r) => r.evidence),
  };
}

export function collectProductionReadinessEvidence(deps: ExecutiveAcceptancePackDependencies) {
  const now = new Date().toISOString();
  const sourceMap: Record<
    ReadinessEvidenceSource,
    { handle: object | null | undefined; probes: string[] }
  > = {
    "monitoring-runtime": {
      handle: deps.monitoringRuntime,
      probes: ["getState", "getDashboard"],
    },
    "audit-runtime": {
      handle: deps.auditRuntime,
      probes: ["getState", "query"],
    },
    "executive-reporting-runtime": {
      handle: deps.executiveReportingRuntime,
      probes: ["getState", "submitWorkerReport"],
    },
  };

  const sources: ProductionReadinessEvidenceRef[] = READINESS_EVIDENCE_SOURCES.map((source) => {
    const { handle, probes } = sourceMap[source];
    const bound = !!handle;
    const presentProbes = bound
      ? probes.filter((p) => typeof (handle as Record<string, unknown>)[p] === "function")
      : [];
    const evidencePresent = bound && presentProbes.length > 0;
    return {
      source,
      bound,
      evidencePresent,
      evidence: bound
        ? [`${source}: bound; probes=${presentProbes.join(",") || "none"}`]
        : [`${source}: not injected`],
    };
  });

  const boundCount = sources.filter((s) => s.bound).length;
  const evidencePresentCount = sources.filter((s) => s.evidencePresent).length;
  let overallClassification: ReadinessClassification = "missing";
  if (evidencePresentCount === READINESS_EVIDENCE_SOURCES.length) overallClassification = "certified";
  else if (evidencePresentCount > 0) overallClassification = "partially_certified";
  else if (boundCount > 0) overallClassification = "blocked";

  return {
    computedAt: now,
    totalSources: READINESS_EVIDENCE_SOURCES.length,
    boundCount,
    evidencePresentCount,
    overallClassification,
    sources,
    evidence: sources.flatMap((s) => s.evidence),
  };
}

export function evaluateGovernanceSummary(repositoryRoot: string, selfDocPath: string) {
  const docPresent = existsSync(join(repositoryRoot, selfDocPath));
  return {
    compliant: docPresent,
    grandKingApprovalRequired: true as const,
    executiveAcceptancePackRequired: true as const,
    selfDocPresent: docPresent,
    selfDocPath,
    boundaryLocksHonoured: true,
    evidence: docPresent
      ? [`Governance doc present: ${selfDocPath}`]
      : [`Governance doc missing: ${selfDocPath}`],
  };
}
