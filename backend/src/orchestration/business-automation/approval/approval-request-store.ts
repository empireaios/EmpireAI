/**
 * G5-05 — Approval request store (in-memory — distributed-ready interface).
 */

import type {
  ApprovalSnapshot,
  ApprovalState,
  AutomationApprovalRequest,
} from "../contracts/approval-types.js";

const approvalStore = new Map<string, AutomationApprovalRequest>();

export class ApprovalRequestStore {
  save(request: AutomationApprovalRequest): AutomationApprovalRequest {
    approvalStore.set(request.approvalId, request);
    return request;
  }

  getById(approvalId: string): AutomationApprovalRequest | undefined {
    return approvalStore.get(approvalId);
  }

  getByCorrelationId(correlationId: string): AutomationApprovalRequest | undefined {
    for (const request of approvalStore.values()) {
      if (request.correlationId === correlationId) return request;
    }
    return undefined;
  }

  list(filter?: { workspaceId?: string; approvalState?: ApprovalState }): AutomationApprovalRequest[] {
    return [...approvalStore.values()].filter((request) => {
      if (filter?.workspaceId && request.workspaceId !== filter.workspaceId) return false;
      if (filter?.approvalState && request.approvalState !== filter.approvalState) return false;
      return true;
    });
  }

  snapshot(workspaceId?: string): ApprovalSnapshot {
    const requests = this.list(workspaceId ? { workspaceId } : undefined);
    const byState = {} as Record<ApprovalState, number>;
    for (const state of [
      "not_required",
      "pending",
      "awaiting_review",
      "approved",
      "rejected",
      "expired",
      "cancelled",
      "superseded",
      "completed",
    ] as ApprovalState[]) {
      byState[state] = requests.filter((request) => request.approvalState === state).length;
    }
    return {
      workspaceId,
      totalCount: requests.length,
      byState,
      requests,
      generatedAt: new Date().toISOString(),
    };
  }

  resetForTests(): void {
    approvalStore.clear();
  }
}

let sharedStore: ApprovalRequestStore | undefined;

export function getApprovalRequestStore(): ApprovalRequestStore {
  if (!sharedStore) {
    sharedStore = new ApprovalRequestStore();
  }
  return sharedStore;
}

export function resetApprovalRequestStoreForTests(): void {
  sharedStore = undefined;
  approvalStore.clear();
}
