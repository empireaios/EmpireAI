import { AR_METADATA_VERSION } from "./paths.js";
import type { PolicyClassification } from "./approval-policy-classifier.js";
import type {
  ApprovalHistoryEntry,
  ApprovalRequest,
  ApprovalRouterInput,
  ApprovalState,
  ValidationStatus,
} from "./types.js";

let approvalSequence = 0;

export class ApprovalRequestBuilder {
  build(
    input: ApprovalRouterInput,
    classification: PolicyClassification,
    validationStatus: ValidationStatus,
  ): ApprovalRequest {
    approvalSequence += 1;
    const timestamp = new Date().toISOString();
    const approvalId = `ar-apr-${Date.now()}-${approvalSequence}`;
    const requestId = input.requestId?.trim() || `ar-req-${Date.now()}-${approvalSequence}`;
    const autonomous = classification.level === "autonomous";
    const currentStatus: ApprovalState = autonomous ? "approved" : "pending";
    const history = [
      this.historyEntry(
        autonomous ? "approved" : "pending",
        "system",
        null,
        autonomous
          ? "Autonomous policy clearance — router did not exercise approval authority"
          : `Routed to pending queue at level ${classification.level}`,
      ),
    ];

    return {
      approvalId,
      timestamp,
      requestId,
      relatedBusiness: input.relatedBusiness?.trim() || null,
      relatedMission: input.relatedMission?.trim() || null,
      requestSummary: input.requestSummary.trim(),
      requestedAction: input.requestedAction.trim(),
      approvalLevel: classification.level,
      reasonApprovalIsRequired: classification.reason,
      riskAssessment: risks(input, classification),
      expectedImpact: impacts(input),
      currentStatus,
      approvalHistory: history,
      metadataVersion: AR_METADATA_VERSION,
      approvalTraceId: `ar-trace-${Date.now()}-${approvalSequence}`,
      approvalRequired: classification.approvalRequired,
      executionAllowed: autonomous,
      executionBlockedReason: autonomous
        ? null
        : `Execution blocked until ${classification.level} conditions are satisfied`,
      policyRuleId: classification.policyRuleId,
      validationStatus,
      neverApproveRequests: true,
      neverExecuteRequests: true,
      neverAssignWorkers: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      requestApprovedByRouter: false,
      requestExecutedByRouter: false,
      workersAssignedByRouter: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveApprovalTraceability: true,
      preserveAuditability: true,
      preserveApprovalIntegrity: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  historyEntry(
    status: ApprovalState,
    actorRole: ApprovalHistoryEntry["actorRole"],
    authority: string | null,
    note: string,
  ): ApprovalHistoryEntry {
    approvalSequence += 1;
    return {
      entryId: `ar-hist-${Date.now()}-${approvalSequence}`,
      timestamp: new Date().toISOString(),
      status,
      actorRole,
      authority,
      note,
    };
  }
}

export function resetApprovalSequenceForTesting() {
  approvalSequence = 0;
}

function risks(
  input: ApprovalRouterInput,
  classification: PolicyClassification,
): string[] {
  const risks = [
    ...(input.riskHints ?? []),
    classification.approvalRequired
      ? `Unauthorized execution before ${classification.level} is a governance violation`
      : "Autonomous path still requires audit trail preservation",
  ];
  if (classification.level === "grand_king_approval") {
    risks.push("High-consequence action may permanently alter empire posture");
  }
  if (classification.level === "multi_stage_approval") {
    risks.push("Partial stage clearance is insufficient for execution");
  }
  return Array.from(new Set(risks.map((r) => r.trim()).filter(Boolean)));
}

function impacts(input: ApprovalRouterInput): string[] {
  const impacts = [
    ...(input.impactHints ?? []),
    `Requested action: ${input.requestedAction.trim()}`,
  ];
  if (input.relatedBusiness) impacts.push(`Business impact scope: ${input.relatedBusiness}`);
  if (input.relatedMission) impacts.push(`Mission impact scope: ${input.relatedMission}`);
  return Array.from(new Set(impacts.map((i) => i.trim()).filter(Boolean)));
}
