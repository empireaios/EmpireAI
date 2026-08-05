import path from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runBootstrap } from "../../../../pillow/src/bootstrap/engine.ts";
import {
  createAuditRuntime,
  resetAuditRuntimeForTesting,
} from "../../../../pillow/src/audit-runtime/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../../../..");
const out = path.join(REPO, "docs/audits/pillow/q10-13-audit-runtime");
mkdirSync(out, { recursive: true });
resetAuditRuntimeForTesting();
const bootstrap = await runBootstrap({ repositoryRoot: REPO, skipHeavyScans: true });
const engine = createAuditRuntime(bootstrap);
await engine.initialize();
engine.connect();
engine.recordWorkerAction({
  validated: true,
  actionPerformed: "cert_worker_probe",
  missionId: "mission-cert-01",
  auditReference: "audit://audrt/cert/worker-01",
  supportingEvidence: ["evid://audrt/cert/worker-01"],
});
engine.recordMissionLifecycle({
  validated: true,
  actionPerformed: "mission_started",
  missionId: "mission-cert-01",
  currentStatus: "running",
  auditReference: "audit://audrt/cert/mission-01",
  supportingEvidence: ["evid://audrt/cert/mission-01"],
});
engine.recordApproval({
  validated: true,
  actionPerformed: "approval_granted",
  decision: "approved",
  missionId: "mission-cert-01",
  auditReference: "audit://audrt/cert/approval-01",
  supportingEvidence: ["evid://audrt/cert/approval-01"],
});
engine.recordRecovery({
  validated: true,
  actionPerformed: "recovery_completed",
  missionId: "mission-cert-01",
  currentStatus: "recovered",
  auditReference: "audit://audrt/cert/recovery-01",
  supportingEvidence: ["evid://audrt/cert/recovery-01"],
});
engine.recordScheduling({
  validated: true,
  actionPerformed: "schedule_triggered",
  missionId: "mission-cert-01",
  currentStatus: "executed",
  auditReference: "audit://audrt/cert/scheduling-01",
  supportingEvidence: ["evid://audrt/cert/scheduling-01"],
});
const integrity = engine.verifyIntegrity({ validated: true });
const produced = engine.produceReport({ validated: true });
const contract = engine.getQ1014ConsumableContract();
const trail = engine.list({ validated: true }).records.slice(0, 8);
writeFileSync(
  path.join(out, "EXAMPLE_AUDIT_TRAIL.json"),
  JSON.stringify({ computedAt: "2026-08-04T15:00:00.000Z", missionId: "Q10-13", records: trail }, null, 2),
);
writeFileSync(
  path.join(out, "EXAMPLE_AUDIT_RUNTIME_REPORT.json"),
  JSON.stringify(produced.auditRuntimeReport, null, 2),
);
writeFileSync(path.join(out, "EXAMPLE_Q1014_CONTRACT.json"), JSON.stringify(contract, null, 2));
console.log(
  JSON.stringify({
    integrity: integrity.decision,
    allPassed: integrity.integrityVerification?.allPassed,
    reportDecision: produced.decision,
    total: produced.auditRuntimeReport?.totalAuditRecords,
    trail: trail.length,
  }),
);
