import type { ApprovalStore } from "./approval-store.js";
import type { ApprovalRequest, ApvrtInput } from "./types.js";

/**
 * Marks timed_out structurally when input.simulateTimeout is true.
 * Does not invent wall-clock timeouts — structural signal only.
 */
export class TimeoutHandler {
  applyTimeout(
    store: ApprovalStore,
    request: ApprovalRequest,
    input: ApvrtInput,
  ): ApprovalRequest | null {
    if (input.simulateTimeout !== true) {
      return null;
    }
    return store.updateRequest(request.approvalId, {
      currentStatus: "timed_out",
      resumeToken: null,
      timestampHistory: [...request.timestampHistory, new Date().toISOString()],
    });
  }
}
