import { nextApvrtId } from "./approval-store.js";
import type { ApprovalStore } from "./approval-store.js";
import type { ApprovalRequest } from "./types.js";

/**
 * After full approval, set status resumed and issue resumeToken.
 * Rejection / timeout / incomplete approval prevent resume.
 */
export class ResumeEngine {
  canResume(request: ApprovalRequest): { ok: boolean; reason?: string } {
    if (request.currentStatus === "rejected") {
      return { ok: false, reason: "Rejection prevents resume execution" };
    }
    if (request.currentStatus === "timed_out") {
      return { ok: false, reason: "Timed-out approvals cannot resume" };
    }
    if (request.currentStatus === "cancelled") {
      return { ok: false, reason: "Cancelled approvals cannot resume" };
    }
    if (request.currentStatus !== "approved" && request.currentStatus !== "resumed") {
      return { ok: false, reason: "Resume requires fully approved request" };
    }
    return { ok: true };
  }

  resume(store: ApprovalStore, request: ApprovalRequest): {
    request: ApprovalRequest | null;
    resumeToken: string | null;
    error?: string;
  } {
    const check = this.canResume(request);
    if (!check.ok) {
      return { request: null, resumeToken: null, error: check.reason };
    }

    const resumeToken = request.resumeToken ?? `resume://${nextApvrtId("apvrt-resume")}`;
    const updated = store.updateRequest(request.approvalId, {
      currentStatus: "resumed",
      resumeToken,
      timestampHistory: [...request.timestampHistory, new Date().toISOString()],
    });
    return { request: updated, resumeToken };
  }
}
