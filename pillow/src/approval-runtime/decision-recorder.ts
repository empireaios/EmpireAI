import { nextApvrtId } from "./approval-store.js";
import type { ApprovalStore } from "./approval-store.js";
import type { ApprovalRequest, ApvrtInput, DecisionKind, DecisionRecord } from "./types.js";

/** Append-only decision recorder — never fabricates decisions. */
export class DecisionRecorder {
  record(
    store: ApprovalStore,
    request: ApprovalRequest,
    decision: DecisionKind,
    input: ApvrtInput,
    stage: string,
  ): DecisionRecord {
    const record: DecisionRecord = {
      decisionId: nextApvrtId("apvrt-dec"),
      approvalId: request.approvalId,
      stage,
      approver: input.approver ?? input.currentApprover ?? request.currentApprover,
      decision,
      timestamp: new Date().toISOString(),
      notesRef: input.notesRef ?? null,
      fabricated: false,
    };
    store.saveDecision(record);
    const history = [...request.decisionHistory, record];
    store.updateRequest(request.approvalId, {
      decisionHistory: history,
      timestampHistory: [...request.timestampHistory, record.timestamp],
    });
    return record;
  }
}
