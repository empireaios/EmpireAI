import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEGRADED_CHAT_MESSAGE,
  decideBffChatSurface,
  stripForbiddenInfraDecoration,
} from "./bff-chat-sanitize.js";

describe("BFF chat sanitize path-parity + valid-answer invariant", () => {
  it("does not degrade substantive NovaCart answer that includes product-focus footer", () => {
    const ask =
      "Short NovaCart-style bounded supplier decision. Eligible if approval granted. VISTA granted. WISP pending. Select.";
    const body = JSON.stringify({
      result: {
        message:
          "Select VISTA.\nContribution/order S$14.60.\nCurrent product focus is Mini Fan.\nWe have no realised commerce on record.",
        kind: "llm",
      },
    });
    const d = decideBffChatSurface({ upstreamOk: true, rawBody: body, userAsk: ask });
    assert.equal(d.degrade, false);
    if (!d.degrade) {
      assert.match(d.message, /Select VISTA/);
      assert.match(d.message, /14\.60/);
      assert.doesNotMatch(d.message, /Current product focus/i);
      assert.equal(d.brainToUserEquivalent, true);
    }
  });

  it("LumaHome-style single paragraph with product focus MUST NOT become terminal", () => {
    const ask = "Short LumaHome supplier decision. Select eligible only.";
    const body = JSON.stringify({
      result: {
        message:
          "Select LumaHome supplier. Current product focus is Mini Fan and realised commerce is zero.",
        kind: "llm",
      },
    });
    const d = decideBffChatSurface({ upstreamOk: true, rawBody: body, userAsk: ask });
    assert.equal(d.degrade, false);
    if (!d.degrade) {
      assert.match(d.message, /LumaHome|Select/i);
      assert.equal(d.brainToUserEquivalent, true);
      assert.notEqual(d.message, DEGRADED_CHAT_MESSAGE);
    }
  });

  it("still degrades truly empty upstream", () => {
    const d = decideBffChatSurface({
      upstreamOk: true,
      rawBody: JSON.stringify({ result: { message: "" } }),
      userAsk: "hello",
    });
    assert.equal(d.degrade, true);
    if (d.degrade) assert.equal(d.reason, "brain_empty");
  });

  it("still degrades short worker proxy timeout text", () => {
    const d = decideBffChatSurface({
      upstreamOk: true,
      rawBody: JSON.stringify({ result: { message: "worker proxy timed out" } }),
      userAsk: "hello",
    });
    assert.equal(d.degrade, true);
  });

  it("strip helper removes pure footer lines only", () => {
    const out = stripForbiddenInfraDecoration(
      "Select NEXUS.\nCurrent product focus is Mini Fan.\nBirth remains unauthorised until Grand King decides.",
      "Select eligible supplier.",
    );
    assert.match(out, /Select NEXUS/);
    assert.doesNotMatch(out, /Current product focus/i);
  });

  it("terminal copy does not claim durable recovery ownership", () => {
    assert.match(DEGRADED_CHAT_MESSAGE, /no durable background recovery/i);
    assert.doesNotMatch(DEGRADED_CHAT_MESSAGE, /retains ownership/i);
  });

  it("VALID_BRAIN_ANSWER_REPLACED invariant: nonempty never degrades", () => {
    const cases = [
      "Select RADIX. Contribution S$14.60.",
      "Product focus matters for inventory. Recommend holding SKU A.",
      "Realised commerce is zero; therefore treat demand as unproven and select conservatively.",
    ];
    for (const message of cases) {
      const d = decideBffChatSurface({
        upstreamOk: true,
        rawBody: JSON.stringify({ result: { message } }),
        userAsk: "Short commercial ask.",
      });
      assert.equal(d.degrade, false, message);
    }
  });
});
