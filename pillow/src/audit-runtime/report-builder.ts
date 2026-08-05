import {
  AUDIT_CATEGORIES,
  AUDRT_CAPABILITIES,
  AUDRT_METADATA_VERSION,
  AUDRT_REPORT_VERSION,
  AUDRT_RUNTIME_VERSION,
  INTEGRITY_STATUSES,
} from "./paths.js";
import { nextAudrtId, type AuditStore } from "./audit-store.js";
import type { AuditRuntimeConfiguration } from "./configuration.js";
import type { MetricsCollector } from "./metrics-collector.js";
import { IntegrityVerifier } from "./integrity-verifier.js";
import type {
  ActivitySummary,
  AuditRecord,
  AuditRuntimeReport,
  EvidenceSummary,
  IntegrationHandshake,
  AudrtDiagnosticsSnapshot,
  Q1014ConsumableContract,
} from "./types.js";

const SECRET_FIELD_KEYS = [
  "apiKey",
  "api_key",
  "password",
  "secret",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "credentials",
  "credential",
  "privateKey",
  "businessPayload",
  "operationalPayload",
];

function summarize(records: AuditRecord[], label: string): ActivitySummary {
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const r of records) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
    byStatus[r.currentStatus] = (byStatus[r.currentStatus] ?? 0) + 1;
  }
  return {
    total: records.length,
    byCategory,
    byStatus,
    supportingEvidence: [`summary:${label}=${records.length}`],
    fabricated: false,
    structuralSignalOnly: true,
  };
}

export class ReportBuilder {
  private readonly integrity = new IntegrityVerifier();

  buildQ1014ConsumableContract(
    _config: AuditRuntimeConfiguration,
  ): Q1014ConsumableContract {
    return {
      contractId: "audrt-q1014-contract-v1",
      contractVersion: AUDRT_METADATA_VERSION,
      producedBy: "audit-runtime",
      missionId: "Q10-13",
      consumerMissionId: "Q10-14",
      exposedFields: [
        "reportId",
        "runtimeVersion",
        "totalAuditRecords",
        "workerActivitySummary",
        "missionActivitySummary",
        "approvalSummary",
        "recoverySummary",
        "schedulingSummary",
        "evidenceSummary",
        "integrityVerification",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
      ],
      auditCategoryCatalog: [...AUDIT_CATEGORIES],
      integrityStatusCatalog: [...INTEGRITY_STATUSES],
      notes: [
        "Structural contract for Q10-14 Shared Runtime Certification — audit evidence only",
        "Audit Runtime never fabricates audit evidence and never deletes audit records",
        "neverImplementQ1014OrLater remains locked — this module does not implement Shared Runtime Certification",
        "Does not execute business logic or modify operational data — structural audit refs only",
      ],
      neverImplementQ1014OrLater: true,
      structuralSignalOnly: true,
    };
  }

  buildDiagnostics(
    store: AuditStore,
    handshakes: IntegrationHandshake[],
  ): AudrtDiagnosticsSnapshot {
    const records = store.list();
    const verification = this.integrity.verifyAll(records);
    return {
      diagnosticsId: nextAudrtId("audrt-diag"),
      timestamp: new Date().toISOString(),
      totalAuditRecords: records.length,
      totalReports: store.listReports().length,
      verifiedCount: verification.verifiedCount,
      failedIntegrityCount: verification.failedCount,
      integrationHandshakes: handshakes.map((h) => ({ ...h, notes: [...h.notes] })),
      notes: [
        "Diagnostics from recorded audit runtime evidence only",
        `Capabilities: ${AUDRT_CAPABILITIES.length}`,
        "Never fabricates audit evidence — digests from canonical recorded fields only",
        "Never deletes audit records — append-only immutable history",
      ],
    };
  }

  buildAuditRuntimeReport(
    store: AuditStore,
    metricsCollector: MetricsCollector,
    config: AuditRuntimeConfiguration,
    params: {
      auditStatus: AuditRuntimeReport["auditStatus"];
      outstandingIssues: string[];
      confidenceScore: number;
    },
  ): AuditRuntimeReport {
    const metrics = metricsCollector.collect(store);
    const records = store.list();
    const integrityVerification = this.integrity.verifyAll(records);

    const workerRecords = records.filter((r) => r.category === "worker_action");
    const missionRecords = records.filter((r) => r.category === "mission_lifecycle");
    const approvalRecords = records.filter((r) => r.category === "approval_decision");
    const recoveryRecords = records.filter((r) => r.category === "recovery_event");
    const schedulingRecords = records.filter((r) => r.category === "scheduling_activity");
    const evidenceRecords = records.filter((r) => r.category === "evidence_attachment");

    const allEvidence = records.flatMap((r) => r.supportingEvidence);
    const uniqueEvidence = new Set(allEvidence);
    const evidenceSummary: EvidenceSummary = {
      totalEvidenceRefs: allEvidence.length,
      uniqueEvidenceRefs: uniqueEvidence.size,
      attachmentCount: evidenceRecords.length,
      supportingEvidence: [
        `evidence:total=${allEvidence.length}`,
        `evidence:unique=${uniqueEvidence.size}`,
        `evidence:attachments=${evidenceRecords.length}`,
      ],
      fabricated: false,
      structuralSignalOnly: true,
    };

    const report: AuditRuntimeReport = {
      reportId: nextAudrtId("audrt-rpt"),
      timestamp: new Date().toISOString(),
      runtimeVersion: AUDRT_RUNTIME_VERSION,
      totalAuditRecords: metrics.totalAuditRecords,
      workerActivitySummary: summarize(workerRecords, "worker"),
      missionActivitySummary: summarize(missionRecords, "mission"),
      approvalSummary: summarize(approvalRecords, "approval"),
      recoverySummary: summarize(recoveryRecords, "recovery"),
      schedulingSummary: summarize(schedulingRecords, "scheduling"),
      evidenceSummary,
      integrityVerification,
      auditStatus: params.auditStatus,
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: AUDRT_METADATA_VERSION,
      reportVersion: AUDRT_REPORT_VERSION,
      workerId: config.workerId,
      consumableByQ1014: true,
      neverFabricateAuditEvidence: true,
      neverDeleteAuditRecords: true,
      neverExecuteBusinessLogic: true,
      neverModifyOperationalData: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1014OrLater: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveCompleteTraceability: true,
      preserveImmutableAuditHistory: true,
      preserveAuditHistory: true,
      deterministicAuditRecording: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };

    return this.stripSecretLikeFields(report);
  }

  stripSecretLikeFields<T>(value: T): T {
    if (value == null || typeof value !== "object") return value;
    if (Array.isArray(value)) {
      return value.map((item) => this.stripSecretLikeFields(item)) as T;
    }
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_FIELD_KEYS.includes(key)) continue;
      if (key === "auditReference") {
        result[key] =
          typeof nested === "string" && nested.startsWith("audit://")
            ? nested
            : typeof nested === "string"
              ? "[REDACTED]"
              : nested;
        continue;
      }
      result[key] = this.stripSecretLikeFields(nested);
    }
    return result as T;
  }
}
