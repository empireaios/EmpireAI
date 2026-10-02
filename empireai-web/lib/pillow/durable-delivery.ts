import type { PillowChatResult, PillowCompletedReasoningKind } from "./types";
import { isTerminalInfrastructureSurface } from "./executive-surface";

export type DurableChatRecord = {
  requestId?: string;
  status?: string;
  failureClass?: string;
  finalResult?: Record<string, unknown> | null;
  brainResult?: Record<string, unknown> | null;
};

export type DurableReceipt = Pick<PillowChatResult, "requestId" | "sessionId">;
// Match the durable worker's completion boundary, not the legacy command fallback.
const COMPLETED_REASONING_KINDS = new Set(["llm", "authority_refusal", "authority_facts", "response_contract"]);

/** A receipt/failure must never be promoted into a completed answer by the UI. */
export function resultFromDurableRecord(
  receipt: DurableReceipt,
  record: DurableChatRecord,
): PillowChatResult | null {
  if (record.requestId && record.requestId !== receipt.requestId) {
    return unavailableDurableResult(receipt, "RESULT_ID_MISMATCH");
  }
  if (record.status === "FAILED_FATAL" || record.status === "FAILED") {
    return {
      ...receipt,
      kind: "error",
      message: `Pillow could not complete this request. Request reference: ${receipt.requestId}. No completed answer is available; the original request has stopped.`,
      latencyMs: 0,
      status: record.status,
      failureClass: record.failureClass,
      semanticSuccess: false,
      requestRemainsRunning: false,
      resultRetrievable: true,
      userResubmissionRequired: false,
    };
  }
  if (record.status !== "COMPLETED") return null;

  const result = record.finalResult ?? record.brainResult;
  const constitutionalGate = result?.constitutionalGate as { allowed?: boolean } | undefined;
  const responseContract = result?.responseContract as { code?: string } | undefined;
  if (
    !result || typeof result.message !== "string" || !result.message.trim() ||
    !COMPLETED_REASONING_KINDS.has(String(result.kind)) ||
    constitutionalGate?.allowed === false || /blocked/i.test(responseContract?.code ?? "") ||
    result.degradedUsed === true || result.transportContractPassed === false ||
    result.semanticSuccess === false || result.brainCompleted === false ||
    result.requestRemainsRunning === true || result.message.trim().startsWith("PILLOW_RESULT_PENDING:") ||
    isTerminalInfrastructureSurface(result.message)
  ) {
    return unavailableDurableResult(receipt, "INVALID_COMPLETED_RESULT");
  }

  const reboundSessionId = typeof result.reboundSessionId === "string" && result.reboundSessionId.trim()
    ? result.reboundSessionId : undefined;
  return {
    ...(result as unknown as PillowChatResult),
    ...receipt,
    message: result.message,
    kind: result.kind as PillowCompletedReasoningKind,
    sessionId: reboundSessionId ?? receipt.sessionId,
    reboundSessionId,
    status: "COMPLETED",
    latencyMs: typeof result.latencyMs === "number" ? result.latencyMs : 0,
    durableRetrieved: true,
    requestRemainsRunning: false,
    resultRetrievable: true,
  };
}

function unavailableDurableResult(receipt: DurableReceipt, failureClass: string): PillowChatResult {
  return {
    ...receipt,
    kind: "error",
    status: "RESULT_UNAVAILABLE",
    message: `The saved response could not be verified. Request reference: ${receipt.requestId}. This is not a completed answer. The request has not been sent again.`,
    latencyMs: 0,
    failureClass,
    semanticSuccess: false,
    requestRemainsRunning: false,
    resultRetrievable: true,
    userResubmissionRequired: false,
  };
}

export function pendingDurableResult(receipt: DurableReceipt, status?: string): PillowChatResult {
  const state = status === "RETRYABLE"
    ? "Pillow recorded a recoverable interruption. Completion is not yet confirmed."
    : status === "ACCEPTED" || status === "RUNNING"
      ? "Pillow accepted this request, but its answer is not ready yet."
      : "Pillow accepted this request, but its current status could not be confirmed.";
  return {
    ...receipt,
    kind: "durable_pending",
    status: status ?? "UNKNOWN",
    message: `${state} Request reference: ${receipt.requestId}. This is a status receipt, not an answer. Reopen the conversation to check the saved request; do not send the same instruction again.`,
    latencyMs: 0,
    semanticSuccess: false,
    // Unknown/retryable does not prove that a worker is still executing.
    requestRemainsRunning: status === "ACCEPTED" || status === "RUNNING",
    resultRetrievable: true,
    userResubmissionRequired: false,
  };
}
