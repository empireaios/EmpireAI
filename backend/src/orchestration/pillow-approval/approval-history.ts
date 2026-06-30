import { randomUUID } from "node:crypto";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import type {
  ApprovalHistoryEntry,
  ApprovalRequest,
  ApprovalStatus,
} from "./types.js";
import type { SqlitePillowApprovalRepository } from "./repository/sqlite-pillow-approval-repository.js";

export class ApprovalHistory {
  constructor(
    private readonly repository: SqlitePillowApprovalRepository,
    private readonly auditLogger?: AuditLogger,
  ) {}

  recordRegistration(request: ApprovalRequest, actor: string): ApprovalHistoryEntry {
    return this.append({
      approvalId: request.approvalId,
      workspaceId: request.workspaceId,
      action: "registered",
      status: request.status,
      actor,
      notes: null,
      metadata: { type: request.type, title: request.proposal.title },
    });
  }

  recordDecision(
    request: ApprovalRequest,
    actor: string,
    notes: string | null,
  ): ApprovalHistoryEntry {
    return this.append({
      approvalId: request.approvalId,
      workspaceId: request.workspaceId,
      action: "decided",
      status: request.status,
      actor,
      notes,
      metadata: { type: request.type },
    });
  }

  recordExpired(request: ApprovalRequest): ApprovalHistoryEntry {
    return this.append({
      approvalId: request.approvalId,
      workspaceId: request.workspaceId,
      action: "expired",
      status: "Expired",
      actor: "pillow-approval-gate",
      notes: "TTL exceeded",
      metadata: {},
    });
  }

  recordDispatched(
    request: ApprovalRequest,
    actor: string,
    missionId: string,
  ): ApprovalHistoryEntry {
    return this.append({
      approvalId: request.approvalId,
      workspaceId: request.workspaceId,
      action: "dispatched",
      status: request.status,
      actor,
      notes: null,
      metadata: { missionId },
    });
  }

  list(workspaceId: string, limit?: number) {
    return this.repository.listApprovalHistory(workspaceId, limit);
  }

  private append(input: {
    approvalId: string;
    workspaceId: string;
    action: ApprovalHistoryEntry["action"];
    status: ApprovalStatus;
    actor: string;
    notes: string | null;
    metadata: Record<string, unknown>;
  }): ApprovalHistoryEntry {
    const entry: ApprovalHistoryEntry = {
      historyId: randomUUID(),
      approvalId: input.approvalId,
      workspaceId: input.workspaceId,
      action: input.action,
      status: input.status,
      actor: input.actor,
      notes: input.notes,
      timestamp: new Date().toISOString(),
      metadata: input.metadata,
    };

    this.repository.appendHistory(entry);
    this.auditLogger?.write({
      action: "pillow.approval.history",
      actor: input.actor,
      workspaceId: input.workspaceId,
      correlationId: entry.historyId,
      metadata: {
        approvalId: input.approvalId,
        action: input.action,
        status: input.status,
      },
    });

    return entry;
  }
}
