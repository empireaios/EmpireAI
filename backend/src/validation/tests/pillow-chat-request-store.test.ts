/**
 * Level A — durable chat request store + context admission (architecture MVA).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  acceptDurableChatRequest,
  admitChatRequestBody,
  admitWorkspaceContextEnvelope,
  completeChatRequest,
  failChatRequest,
  getChatRequest,
  markChatRequestRunning,
} from "../../runtime/pillow-chat-request-store.js";
import { pillowWorkspaceContextSchema } from "../../orchestration/pillow-host/workspace-context.js";

describe("pillow chat request durability + admission", () => {
  it("admits oversized recentConversationTurns instead of hard-fail", () => {
    const huge = "X".repeat(12_000);
    const admitted = admitWorkspaceContextEnvelope({
      screenPath: "/cockpit/development/pillow",
      screenId: "SCR-800",
      screenTitle: "Pillow Centre",
      recentConversationTurns: [
        { role: "grand-king", content: "hi" },
        { role: "pillow", content: huge },
      ],
    }) as {
      recentConversationTurns: Array<{ content: string }>;
    };
    assert.ok(admitted.recentConversationTurns[1]!.content.length <= 8000);
    const parsed = pillowWorkspaceContextSchema.parse(admitted);
    assert.ok(parsed.recentConversationTurns?.[1]?.content.length! <= 8000);
  });

  it("zod schema transform truncates without throwing", () => {
    const huge = "Y".repeat(9000);
    const parsed = pillowWorkspaceContextSchema.parse({
      screenPath: "/x",
      screenId: "id",
      screenTitle: "t",
      recentConversationTurns: [{ role: "pillow", content: huge }],
    });
    assert.ok((parsed.recentConversationTurns?.[0]?.content.length ?? 0) <= 8000);
  });

  it("durable request completes and is retrievable", async () => {
    const rec = await acceptDurableChatRequest({
      sessionId: "sess_test",
      message: "Atlas eligibility",
    });
    await markChatRequestRunning(rec.requestId, 1);
    await completeChatRequest(rec.requestId, { message: "Select Atlas.", kind: "llm" });
    const got = await getChatRequest(rec.requestId);
    assert.equal(got?.status, "COMPLETED");
    assert.equal(got?.brainResult?.message, "Select Atlas.");
    assert.equal(got?.failureClass, "BRAIN_SUCCESS");
  });

  it("durable request failure taxonomy stored", async () => {
    const rec = await acceptDurableChatRequest({
      sessionId: "sess_fail",
      message: "ask",
    });
    await failChatRequest(rec.requestId, {
      failureClass: "REQUEST_NOT_ACCEPTED",
      upstreamStatus: 400,
      attempt: 1,
    });
    const got = await getChatRequest(rec.requestId);
    assert.equal(got?.status, "FAILED_FATAL");
    assert.equal(got?.failureClass, "REQUEST_NOT_ACCEPTED");
    assert.equal(got?.upstreamStatus, 400);
  });

  it("retryable failure stays RETRYABLE not fatal", async () => {
    const rec = await acceptDurableChatRequest({
      sessionId: "sess_retry",
      message: "ask",
    });
    await failChatRequest(rec.requestId, {
      failureClass: "UPSTREAM_5XX_RETRYABLE",
      upstreamStatus: 500,
      attempt: 1,
    });
    const got = await getChatRequest(rec.requestId);
    assert.equal(got?.status, "RETRYABLE");
  });

  it("persist precedes delivery markers", async () => {
    const rec = await acceptDurableChatRequest({
      sessionId: "sess_persist",
      message: "ask",
    });
    await completeChatRequest(rec.requestId, { message: "done", kind: "llm" });
    const got = await getChatRequest(rec.requestId);
    assert.equal(got?.status, "COMPLETED");
    assert.ok(got?.observability?.resultPersistedAt);
    assert.equal(got?.deliveryState, "NOT_STARTED");
  });

  it("admitChatRequestBody mutates oversized envelope", () => {
    const body = JSON.stringify({
      message: "checkpoint",
      sessionId: "s1",
      workspaceContext: {
        screenPath: "/p",
        screenId: "s",
        screenTitle: "t",
        recentConversationTurns: [{ role: "pillow", content: "Z".repeat(9000) }],
      },
    });
    const out = admitChatRequestBody(body);
    assert.equal(out.mutated, true);
    const parsed = JSON.parse(out.bodyText) as {
      workspaceContext: { recentConversationTurns: Array<{ content: string }> };
    };
    assert.ok(parsed.workspaceContext.recentConversationTurns[0]!.content.length <= 8000);
  });
});
