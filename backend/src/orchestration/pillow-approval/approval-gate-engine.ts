import { randomUUID } from "node:crypto";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import { ApprovalHistory } from "./approval-history.js";
import { ApprovalQueue } from "./approval-queue.js";
import {
  canDecide,
  isDryRunOnly,
  isObjectiveVisibleApproval,
  requiresCursorBridge,
  resolveApprovalExpiry,
  validateRegistration,
  evaluateObjectiveAlignment,
  type ObjectiveAlignmentEvaluator,
} from "./approval-policy.js";
import type { CursorBridgeAdapter } from "./cursor-bridge-adapter.js";
import {
  ensurePillowApprovalTables,
  SqlitePillowApprovalRepository,
} from "./repository/sqlite-pillow-approval-repository.js";
import type {
  ApprovalRequest,
  DecideApprovalInput,
  RegisterApprovalInput,
} from "./types.js";

export class ApprovalNotFoundError extends Error {
  constructor(id: string) {
    super(`Approval request not found: ${id}`);
    this.name = "ApprovalNotFoundError";
  }
}

export class ApprovalGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApprovalGateError";
  }
}

/** PILLOW-017 unified Approval Gate — no repository writes or Cursor dispatch without approval. */
export class ApprovalGateEngine {
  private readonly repository = new SqlitePillowApprovalRepository();
  private readonly queue = new ApprovalQueue();
  private readonly history: ApprovalHistory;
  private cursorBridge: CursorBridgeAdapter | null = null;
  private objectiveEvaluator: ObjectiveAlignmentEvaluator | null = null;

  constructor(auditLogger?: AuditLogger, objectiveEvaluator?: ObjectiveAlignmentEvaluator) {
    ensurePillowApprovalTables();
    this.history = new ApprovalHistory(this.repository, auditLogger);
    this.objectiveEvaluator = objectiveEvaluator ?? null;
  }

  attachObjectiveEvaluator(evaluator: ObjectiveAlignmentEvaluator): void {
    this.objectiveEvaluator = evaluator;
  }

  attachCursorBridge(bridge: CursorBridgeAdapter): void {
    this.cursorBridge = bridge;
  }

  register(input: RegisterApprovalInput): ApprovalRequest {
    const validation = validateRegistration(input);
    if (!validation.valid) {
      throw new ApprovalGateError(validation.reason ?? "Invalid approval registration");
    }

    const grandKingOverride = input.proposal.metadata?.grandKingOverride === true;
    const objectiveCheck = evaluateObjectiveAlignment(input, this.objectiveEvaluator ?? undefined);

    if (
      !objectiveCheck.allowed &&
      !grandKingOverride &&
      (input.type === "cursor_mission_execution" || input.type === "runtime_operation")
    ) {
      throw new ApprovalGateError(
        `blocked_by_current_objective: ${objectiveCheck.reason}`,
      );
    }

    const objectiveAlignment = grandKingOverride
      ? "requires_grand_king_override"
      : objectiveCheck.alignment;

    const now = new Date().toISOString();
    const request: ApprovalRequest = {
      approvalId: randomUUID(),
      workspaceId: input.workspaceId,
      type: input.type,
      status: "Pending",
      proposal: {
        ...input.proposal,
        objectiveAlignment,
        metadata: {
          ...input.proposal.metadata,
          objectiveAlignment,
          storedInVault: objectiveCheck.storedInVault ?? false,
        },
      },
      requestedBy: input.requestedBy,
      correlationId: input.correlationId,
      createdAt: now,
      updatedAt: now,
      expiresAt: resolveApprovalExpiry(input.ttlHours),
      decidedAt: null,
      decidedBy: null,
      decisionNotes: null,
      linkedMissionId: input.proposal.missionId ?? null,
    };

    this.repository.saveApproval(request);
    this.history.recordRegistration(request, input.requestedBy);
    return request;
  }

  decide(input: DecideApprovalInput): ApprovalRequest {
    const request = this.repository.getApproval(input.approvalId);
    if (!request || request.workspaceId !== input.workspaceId) {
      throw new ApprovalNotFoundError(input.approvalId);
    }

    const gate = canDecide(request);
    if (!gate.allowed) {
      throw new ApprovalGateError(gate.reason ?? "Decision not allowed");
    }

    const now = new Date().toISOString();
    const updated: ApprovalRequest = {
      ...request,
      status: input.outcome,
      decidedAt: now,
      decidedBy: input.actor,
      decisionNotes: input.notes ?? null,
      updatedAt: now,
    };

    this.repository.saveApproval(updated);
    this.history.recordDecision(updated, input.actor, input.notes ?? null);

    if (input.outcome === "Approved") {
      this.executeApproved(updated, input.actor, input.correlationId);
    }

    return updated;
  }

  cancel(approvalId: string, workspaceId: string, actor: string): ApprovalRequest {
    return this.decide({
      approvalId,
      workspaceId,
      outcome: "Cancelled",
      actor,
      correlationId: randomUUID(),
      notes: "Cancelled by operator",
    });
  }

  expireStale(workspaceId: string): ApprovalRequest[] {
    const expired: ApprovalRequest[] = [];
    const pending = this.repository.listApprovals(workspaceId, {
      status: "Pending",
      limit: 200,
    });
    const now = Date.now();

    for (const request of pending) {
      if (Date.parse(request.expiresAt) >= now) continue;
      const updated: ApprovalRequest = {
        ...request,
        status: "Expired",
        updatedAt: new Date().toISOString(),
      };
      this.repository.saveApproval(updated);
      this.history.recordExpired(updated);
      expired.push(updated);
    }

    return expired;
  }

  get(approvalId: string): ApprovalRequest | null {
    return this.repository.getApproval(approvalId);
  }

  list(workspaceId: string, status?: ApprovalRequest["status"]): ApprovalRequest[] {
    this.expireStale(workspaceId);
    const rows = this.repository.listApprovals(workspaceId, {
      status,
      limit: 200,
    });
    return status ? rows : rows;
  }

  listPending(workspaceId: string): ApprovalRequest[] {
    this.expireStale(workspaceId);
    const rows = this.repository.listApprovals(workspaceId, {
      status: "Pending",
      limit: 200,
    });
    const pending = this.queue.listPending(rows);
    return pending.filter((request) => isObjectiveVisibleApproval(request));
  }

  listHistory(workspaceId: string, limit?: number) {
    return this.history.list(workspaceId, limit);
  }

  private executeApproved(
    request: ApprovalRequest,
    actor: string,
    correlationId: string,
  ): void {
    if (requiresCursorBridge(request.type)) {
      if (!this.cursorBridge) {
        throw new ApprovalGateError("Cursor bridge not attached");
      }
      const missionId = request.proposal.missionId;
      if (!missionId) {
        throw new ApprovalGateError("Approved cursor mission missing missionId");
      }

      const sessionBridge = this.cursorBridge;
      const result = sessionBridge.dispatchMission({
        workspaceId: request.workspaceId,
        approvalId: request.approvalId,
        missionId,
        actor,
        correlationId,
        dryRun: true,
      });

      const linked: ApprovalRequest = {
        ...request,
        linkedMissionId: result.record.missionId,
        updatedAt: new Date().toISOString(),
      };
      this.repository.saveApproval(linked);
      this.history.recordDispatched(linked, actor, result.record.missionId);
      return;
    }

    if (isDryRunOnly(request.type)) {
      this.history.recordDispatched(request, actor, request.linkedMissionId ?? "dry-run");
      return;
    }

    this.history.recordDispatched(
      request,
      actor,
      request.linkedMissionId ?? request.approvalId,
    );
  }
}
