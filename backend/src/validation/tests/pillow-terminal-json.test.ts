import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  acceptDurableChatRequest, acceptDurableChatRequestClaim, completeChatRequest,
  configureChatRequestStore, dropChatRequestMemoryCacheForTests, getChatRequest,
  settleReasoningRequest, PillowDurableStoreUnavailableError,
} from "../../runtime/pillow-chat-request-store.js";

const answer = () => ({ z: "first", nested: { emptyArray: [], emptyObject: {}, precise: 1.2345678901234567 }, a: [[], { b: false }] });
const storage = () => {
  const values = new Map<string, string>();
  return { values, async get(key: string) { return values.get(key) ?? null; },
    async setex(key: string, _ttl: number, value: string) { values.set(key, value); return "OK"; } };
};
afterEach(() => { configureChatRequestStore(null); dropChatRequestMemoryCacheForTests(); });

test("completed legacy writes preserve the exact JSON answer in the durable envelope", async () => {
  const redis = storage(); configureChatRequestStore(null);
  const request = await acceptDurableChatRequest({ sessionId: "json-test", message: "preserve answer" });
  await redis.setex("pillow:chatreq:v2:" + request.requestId, 300, JSON.stringify(request));
  configureChatRequestStore(redis, { requireRedisDurability: true });
  const result = answer(); await completeChatRequest(request.requestId, result);
  const key = `pillow:chatreq:v2:${request.requestId}`;
  const raw = JSON.parse(redis.values.get(key)!);
  assert.equal(raw.resultJson, JSON.stringify(result));
  // Model the cjson damage in compatibility fields without changing the opaque envelope.
  raw.finalResult = { corrupted: true }; raw.brainResult = { nested: {} };
  redis.values.set(key, JSON.stringify(raw)); dropChatRequestMemoryCacheForTests();
  const restored = await getChatRequest(request.requestId);
  assert.equal(JSON.stringify(restored!.finalResult), JSON.stringify(result));
  assert.deepEqual(restored!.brainResult, result);
  assert.equal(Object.hasOwn(restored!, "resultJson"), false);
});

test("atomic settlement supplies original JSON outside the Lua-decoded patch", async () => {
  const redis = storage(); const result = answer(); let received: unknown[] = [];
  configureChatRequestStore({ ...redis, async eval(_script: string, _keys: number, ...args: Array<string | number>) { received = args; return 1; } }, { requireRedisDurability: true });
  assert.equal(await settleReasoningRequest({ requestId: "test", leaseToken: 7, result }), true);
  assert.equal(received.at(-1), JSON.stringify(result));
});

test("idempotent completed acceptance hydrates the canonical answer and hides its storage field", async () => {
  const redis = storage(); const result = answer();
  const raw = JSON.stringify({ requestId: "already-complete", status: "COMPLETED", finalResult: {}, brainResult: {}, resultJson: JSON.stringify(result) });
  configureChatRequestStore({ ...redis, async eval() { return ["EXISTING", raw]; } }, { requireRedisDurability: true });
  const accepted = await acceptDurableChatRequestClaim({ sessionId: "test", message: "same input" });
  assert.equal(accepted.disposition, "EXISTING_COMPLETED");
  assert.equal(JSON.stringify(accepted.request.finalResult), JSON.stringify(result));
  assert.equal(Object.hasOwn(accepted.request, "resultJson"), false);
});

test("invalid canonical envelopes fail closed rather than silently falling back to altered fields", async () => {
  const redis = storage(); configureChatRequestStore(redis, { requireRedisDurability: true });
  for (const resultJson of [null, 7, "not-json", "null", "[]", '"string"']) {
    redis.values.set("pillow:chatreq:v2:corrupt", JSON.stringify({ requestId: "corrupt", status: "COMPLETED", finalResult: { message: "plausible fallback" }, resultJson }));
    await assert.rejects(getChatRequest("corrupt"), PillowDurableStoreUnavailableError);
  }
});