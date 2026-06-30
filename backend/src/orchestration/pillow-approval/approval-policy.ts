import type {
  ApprovalRequest,
  ApprovalType,
  RegisterApprovalInput,
} from "./types.js";

const DEFAULT_TTL_HOURS = 72;

export type ObjectiveAlignmentResult = {
  allowed: boolean;
  alignment:
    | "objective_aligned"
    | "deferred_not_aligned"
    | "requires_grand_king_override"
    | "blocked_by_current_objective";
  reason: string;
  storedInVault?: boolean;
};

export type ObjectiveAlignmentEvaluator = (
  input: RegisterApprovalInput,
) => ObjectiveAlignmentResult;

const REQUIRED_EVIDENCE: Partial<Record<ApprovalType, number>> = {
  repository_write: 1,
  cursor_mission_execution: 0,
  executive_audit_generation: 1,
};

export function resolveApprovalExpiry(ttlHours?: number): string {
  const hours = ttlHours ?? DEFAULT_TTL_HOURS;
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function validateRegistration(input: RegisterApprovalInput): {
  valid: boolean;
  reason?: string;
} {
  if (!input.proposal.title.trim()) {
    return { valid: false, reason: "Proposal title is required" };
  }
  if (!input.proposal.summary.trim()) {
    return { valid: false, reason: "Proposal summary is required" };
  }

  const minEvidence = REQUIRED_EVIDENCE[input.type] ?? 0;
  const evidenceCount = input.proposal.evidence?.length ?? 0;
  if (evidenceCount < minEvidence) {
    return {
      valid: false,
      reason: `${input.type} requires at least ${minEvidence} evidence item(s)`,
    };
  }

  if (
    input.type === "cursor_mission_execution" &&
    !input.proposal.missionId?.trim()
  ) {
    return {
      valid: false,
      reason: "cursor_mission_execution requires proposal.missionId",
    };
  }

  return { valid: true };
}

export function evaluateObjectiveAlignment(
  input: RegisterApprovalInput,
  evaluator?: ObjectiveAlignmentEvaluator,
): ObjectiveAlignmentResult {
  if (!evaluator) {
    return {
      allowed: true,
      alignment: "objective_aligned",
      reason: "Objective gate not attached",
    };
  }
  return evaluator(input);
}

export function isObjectiveVisibleApproval(
  request: ApprovalRequest,
): boolean {
  const alignment =
    request.proposal.objectiveAlignment ??
    (request.proposal.metadata?.objectiveAlignment as string | undefined);
  if (!alignment) return true;
  return (
    alignment === "objective_aligned" ||
    alignment === "requires_grand_king_override"
  );
}

export function canDecide(request: ApprovalRequest): {
  allowed: boolean;
  reason?: string;
} {
  if (request.status !== "Pending") {
    return {
      allowed: false,
      reason: `Approval is ${request.status}, not Pending`,
    };
  }
  if (Date.parse(request.expiresAt) < Date.now()) {
    return { allowed: false, reason: "Approval has expired" };
  }
  return { allowed: true };
}

export function requiresCursorBridge(type: ApprovalType): boolean {
  return type === "cursor_mission_execution";
}

export function isDryRunOnly(type: ApprovalType): boolean {
  return type === "repository_write" || type === "file_generation";
}
