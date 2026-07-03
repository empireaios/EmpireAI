import type { ExecutiveObjective } from "../models/objective-management.js";

const DEFAULT_WORKSPACE = "ws_empire_1";
const DEFAULT_COMPANY = "co-grand-king";

/** OBJ-001 — first default executive objective (PROOF-001). */
export function createDefaultProof001Objective(
  workspaceId = DEFAULT_WORKSPACE,
  companyId = DEFAULT_COMPANY,
): ExecutiveObjective {
  const startDate = new Date();
  const targetDate = new Date(startDate);
  targetDate.setDate(targetDate.getDate() + 70);

  return {
    objectiveId: "OBJ-001",
    workspaceId,
    companyId,
    title: "PROOF-001",
    description:
      "Achieve the first verified positive net profit for the Grand King account.",
    executivePriority: "CRITICAL",
    owner: "Pillow",
    status: "ACTIVE",
    startDate: startDate.toISOString(),
    targetCompletionDate: targetDate.toISOString(),
    successCriteria: [
      "First live order fulfilled with positive net margin",
      "Ledger verified profit recorded in Brain",
      "All 12 first-revenue validation stages PASS in LIVE mode",
      "PROOF-001 artifact reconciled for Grand King account",
    ],
    failureCriteria: [
      "Target date passes without verified positive net profit",
      "First SKU runs negative margin without King-approved exception",
    ],
    dependencies: ["B6", "B7", "B8", "CRIR", "CB-08"],
    currentProgressPercent: 0,
    confidencePercent: 45,
    criticalPath: [
      "B5 — Production deploy + readiness pass ✅ FROZEN",
      "B6-01 — Amazon SP-API production credentials",
      "B6-02 — CJ Dropshipping production credentials",
      "B6-03 — Stripe production API integration",
      "B6-04 — Credential Vault verification",
      "B6-05 — Commerce adapter connectivity test",
      "CRIR — Certified Commercial Risk Intelligence Report",
      "B7 — Grand King go-live approval",
      "First live order → fulfilment → ledger",
      "B8 — PROOF-001 verified net profit",
    ],
    currentBlockers: [],
    nextHighestImpactAction: "B6-01 — Inject Amazon SP-API production credentials on Railway",
    overallHealth: "YELLOW",
    remainingWork: [
      "B6-01 Amazon SP-API credentials",
      "B6-02 CJ Dropshipping credentials",
      "B6-03 Stripe production keys",
      "B6-04 Credential Vault key",
      "B6-05 Commerce adapter connectivity test",
      "CRIR registration for first SKU",
      "Grand King go-live approval",
      "First revenue validation run",
    ],
    forecastCompletionDate: targetDate.toISOString(),
    businessValueScore: 100,
    lastUpdated: new Date().toISOString(),
    completionDate: null,
    metadata: { missionCode: "PROOF-001", source: "OMS-default" },
  };
}

export function createDefaultObjectives(
  workspaceId = DEFAULT_WORKSPACE,
  companyId = DEFAULT_COMPANY,
): ExecutiveObjective[] {
  return [createDefaultProof001Objective(workspaceId, companyId)];
}
