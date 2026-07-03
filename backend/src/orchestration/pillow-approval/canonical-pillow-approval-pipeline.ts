/**
 * Pillow Completion — ONE canonical approval pipeline.
 * Bridges G5 PillowApprovalRouter ↔ PILLOW-017 ApprovalGateEngine ↔ EKLS.
 */

import type { AutomationApprovalRequest } from "../business-automation/contracts/approval-types.js";
import { getPillowApprovalRouter } from "../business-automation/approval/pillow-approval-router.js";
import { recordAutomationOperationsEklsObservation } from "../grand-king-business-automation-operations/ekls/automation-operations-ekls-integration.js";
import type { ApprovalGateEngine } from "./approval-gate-engine.js";
import type { ApprovalRequest, ApprovalStatus } from "./types.js";

const G5_SOURCE = "g5-pillow-approval-router" as const;
const GATE_SOURCE = "pillow-approval-gate" as const;

let approvalGateRef: ApprovalGateEngine | null = null;

export function wireCanonicalPillowApprovalPipeline(gate: ApprovalGateEngine): void {
  approvalGateRef = gate;
}

export function getCanonicalApprovalGate(): ApprovalGateEngine | null {
  return approvalGateRef;
}

function mapG5StateToGateStatus(state: AutomationApprovalRequest["approvalState"]): ApprovalStatus | null {
  switch (state) {
    case "pending":
    case "awaiting_review":
      return "Pending";
    case "approved":
    case "completed":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "expired":
      return "Expired";
    case "cancelled":
      return "Cancelled";
    default:
      return null;
  }
}

function mapGateStatusToG5Outcome(status: ApprovalStatus): "approved" | "rejected" | "cancelled" | "expired" | null {
  switch (status) {
    case "Approved":
      return "approved";
    case "Rejected":
      return "rejected";
    case "Cancelled":
      return "cancelled";
    case "Expired":
      return "expired";
    default:
      return null;
  }
}

export function recordCanonicalApprovalEklsOutcome(input: {
  approvalId: string;
  workspaceId: string;
  actorId: string;
  outcome: string;
  summary: string;
}): void {
  recordAutomationOperationsEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    automationOperationId: input.approvalId,
    ownerId: "canonical-pillow-approval-pipeline",
    kind: "automation_operation_learning",
    summary: `${input.outcome}: ${input.summary}`,
    pillowGovernance: true,
  });
}

/** Mirror a G5 automation approval into the Pillow Approval Gate queue. */
export function mirrorG5SubmissionToCanonicalGate(request: AutomationApprovalRequest): ApprovalRequest | null {
  const gate = approvalGateRef;
  if (!gate) return null;

  const evidence = request.supportingEvidence ?? {};
  if (evidence.canonicalGateApprovalId) {
    return null;
  }

  const approval = gate.register({
    workspaceId: request.workspaceId,
    type: "runtime_operation",
    proposal: {
      title: `Automation approval · ${request.workflowId}`,
      summary:
        request.decisionReference ??
        `${request.workflowId} · tier ${request.approvalTier} · ${request.approvalState}`,
      evidence: [
        request.triggerId,
        request.approvalRegistryId,
        request.approvalPolicyId,
      ].filter(Boolean),
      metadata: {
        source: G5_SOURCE,
        g5ApprovalId: request.approvalId,
        workflowId: request.workflowId,
        triggerId: request.triggerId,
        approvalTier: request.approvalTier,
        correlationId: request.correlationId,
      },
    },
    requestedBy: request.requestedBy,
    correlationId: request.correlationId,
  });

  request.supportingEvidence = {
    ...evidence,
    canonicalGateApprovalId: approval.approvalId,
    canonicalPipeline: true,
  };

  return approval;
}

/** Sync a Gate decision back to the linked G5 approval request. */
export async function syncGateDecisionToG5(
  gateApproval: ApprovalRequest,
  actorId: string,
  notes?: string | null,
): Promise<AutomationApprovalRequest | null> {
  const g5ApprovalId = gateApproval.proposal.metadata?.g5ApprovalId;
  if (typeof g5ApprovalId !== "string") return null;

  const router = getPillowApprovalRouter();
  const g5Request = router.getApprovalStatus(g5ApprovalId);
  if (!g5Request) return null;

  const outcome = mapGateStatusToG5Outcome(gateApproval.status);
  if (!outcome) return null;

  if (["approved", "rejected", "cancelled", "expired"].includes(g5Request.approvalState)) {
    return g5Request;
  }

  const input = {
    approvalId: g5ApprovalId,
    actorId,
    workspaceId: g5Request.workspaceId,
    reason: notes ?? `Synced from canonical Pillow gate (${gateApproval.approvalId})`,
    pillowGovernance: true as const,
  };

  if (outcome === "approved") return router.grantApproval(input);
  if (outcome === "rejected") return router.rejectApproval(input);
  if (outcome === "cancelled") return router.cancelApproval(input);
  if (outcome === "expired") return router.expireApproval(input);
  return null;
}

/** Sync a G5 terminal outcome back to the linked Gate approval. */
export function syncG5OutcomeToGate(
  g5Request: AutomationApprovalRequest,
  actorId: string,
): ApprovalRequest | null {
  const gate = approvalGateRef;
  if (!gate) return null;

  const gateApprovalId = g5Request.supportingEvidence?.canonicalGateApprovalId;
  if (typeof gateApprovalId !== "string") return null;

  const gateStatus = mapG5StateToGateStatus(g5Request.approvalState);
  if (!gateStatus || gateStatus === "Pending") return null;

  const outcome =
    gateStatus === "Approved"
      ? ("Approved" as const)
      : gateStatus === "Rejected"
        ? ("Rejected" as const)
        : gateStatus === "Cancelled"
          ? ("Cancelled" as const)
          : ("Rejected" as const);

  try {
    return gate.decide({
      approvalId: gateApprovalId,
      workspaceId: g5Request.workspaceId,
      outcome,
      actor: actorId,
      correlationId: g5Request.correlationId,
      notes: `Synced from G5 approval router (${g5Request.approvalId})`,
    });
  } catch {
    return null;
  }
}

export type CanonicalApprovalListItem = ApprovalRequest & {
  pipelineSource: typeof G5_SOURCE | typeof GATE_SOURCE | "merged";
  g5ApprovalId?: string;
  workflowId?: string;
};

/** Unified pending + history list for Pillow cockpit. */
export function listCanonicalApprovals(
  gate: ApprovalGateEngine,
  workspaceId: string,
  options?: { status?: ApprovalStatus; includeHistory?: boolean },
): CanonicalApprovalListItem[] {
  const gateApprovals = options?.status
    ? gate.list(workspaceId, options.status)
    : options?.includeHistory
      ? gate.list(workspaceId)
      : gate.listPending(workspaceId);

  const items: CanonicalApprovalListItem[] = gateApprovals.map((approval) => ({
    ...approval,
    pipelineSource:
      approval.proposal.metadata?.source === G5_SOURCE ? G5_SOURCE : GATE_SOURCE,
    g5ApprovalId:
      typeof approval.proposal.metadata?.g5ApprovalId === "string"
        ? approval.proposal.metadata.g5ApprovalId
        : undefined,
    workflowId:
      typeof approval.proposal.metadata?.workflowId === "string"
        ? approval.proposal.metadata.workflowId
        : undefined,
  }));

  const router = getPillowApprovalRouter();
  const g5Snapshot = router.getCockpitApprovalStatus(workspaceId);
  const knownG5Ids = new Set(items.map((item) => item.g5ApprovalId).filter(Boolean));

  for (const g5 of g5Snapshot.requests) {
    if (knownG5Ids.has(g5.approvalId)) continue;
    if (
      !options?.includeHistory &&
      !["pending", "awaiting_review"].includes(g5.approvalState)
    ) {
      continue;
    }
    if (options?.status) {
      const mapped = mapG5StateToGateStatus(g5.approvalState);
      if (mapped !== options.status) continue;
    }

    items.push({
      approvalId: g5.approvalId,
      workspaceId: g5.workspaceId,
      type: "runtime_operation",
      status: mapG5StateToGateStatus(g5.approvalState) ?? "Pending",
      proposal: {
        title: `Automation approval · ${g5.workflowId}`,
        summary: g5.decisionReference ?? `${g5.workflowId} · tier ${g5.approvalTier}`,
        evidence: [g5.triggerId, g5.approvalRegistryId].filter(Boolean),
        metadata: {
          source: G5_SOURCE,
          g5ApprovalId: g5.approvalId,
          workflowId: g5.workflowId,
          triggerId: g5.triggerId,
          approvalTier: g5.approvalTier,
        },
      },
      requestedBy: g5.requestedBy,
      correlationId: g5.correlationId,
      createdAt: g5.requestedAt,
      updatedAt: g5.requestedAt,
      expiresAt: g5.expiryAt ?? new Date(Date.now() + 86_400_000).toISOString(),
      decidedAt: null,
      decidedBy: null,
      decisionNotes: null,
      linkedMissionId: null,
      pipelineSource: G5_SOURCE,
      g5ApprovalId: g5.approvalId,
      workflowId: g5.workflowId,
    });
  }

  return items.sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
}
