/**
 * D-006: an accepted-request receipt must never be scored as a useful executive answer.
 * Receipts must carry requestId and PILLOW_RESULT_PENDING when completion is not retrieved.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

function isUsefulExecutiveAnswer(message: string, kind?: string): boolean {
  const t = String(message || "");
  if (kind === "durable_pending" || kind === "terminal_infrastructure") return false;
  if (/PILLOW_RESULT_PENDING/i.test(t)) return false;
  if (/I accepted your request/i.test(t) && !/\bEligible candidates:|\bCheckpoint token:/i.test(t)) {
    return false;
  }
  if (!t.trim()) return false;
  return true;
}

function buildPendingReceipt(requestId: string): { kind: string; message: string; requestId: string } {
  return {
    kind: "durable_pending",
    requestId,
    message: [
      `PILLOW_RESULT_PENDING: requestId=${requestId}`,
      "Request accepted; completion is still in progress or recoverable.",
      "This receipt is not the executive answer. Result remains retrievable by request ID — do not resubmit the same ask.",
    ].join("\n"),
  };
}

describe("D-006 durable pending receipt is not a useful answer", () => {
  it("labels pending with requestId and rejects as useful", () => {
    const r = buildPendingReceipt("pcr_test_abc");
    assert.match(r.message, /PILLOW_RESULT_PENDING: requestId=pcr_test_abc/);
    assert.equal(isUsefulExecutiveAnswer(r.message, r.kind), false);
  });

  it("legacy accepted wording without answer is not useful", () => {
    const msg =
      "I accepted your request (pcr_old). Completion is still in progress or recoverable — the result will be available via request status without resubmitting the same ask.";
    assert.equal(isUsefulExecutiveAnswer(msg, "durable_pending"), false);
  });

  it("completed two-line decision remains useful", () => {
    const msg = "Eligible candidates: Alpha, Beta\nCandidate selected: Beta";
    assert.equal(isUsefulExecutiveAnswer(msg, "shadow_ceo_episode"), true);
  });
});
