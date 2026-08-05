import type { AuditStore } from "./audit-store.js";
import { IntegrityVerifier } from "./integrity-verifier.js";
import type { AuditMetrics } from "./types.js";

export class MetricsCollector {
  private readonly integrity = new IntegrityVerifier();

  collect(store: AuditStore): AuditMetrics {
    const records = store.list();
    return {
      totalAuditRecords: records.length,
      workerActionCount: records.filter((r) => r.category === "worker_action").length,
      missionLifecycleCount: records.filter((r) => r.category === "mission_lifecycle").length,
      approvalCount: records.filter((r) => r.category === "approval_decision").length,
      recoveryCount: records.filter((r) => r.category === "recovery_event").length,
      schedulingCount: records.filter((r) => r.category === "scheduling_activity").length,
      evidenceAttachmentCount: records.filter((r) => r.category === "evidence_attachment").length,
      verifiedCount: records.filter((r) => this.integrity.verifyRecord(r)).length,
      totalReports: store.listReports().length,
    };
  }
}
