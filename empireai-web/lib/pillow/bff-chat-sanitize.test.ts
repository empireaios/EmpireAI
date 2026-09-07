import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEGRADED_CHAT_MESSAGE,
  decideBffChatSurface,
  stripForbiddenInfraDecoration,
} from "./bff-chat-sanitize.js";

describe("BFF chat sanitize path-parity", () => {
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
      assert.doesNotMatch(d.message, /product focus/i);
      assert.doesNotMatch(d.message, /realised commerce/i);
      assert.equal(d.stripped, true);
    }
  });

  it("still degrades empty upstream", () => {
    const d = decideBffChatSurface({
      upstreamOk: true,
      rawBody: JSON.stringify({ result: { message: "" } }),
      userAsk: "hello",
    });
    assert.equal(d.degrade, true);
  });

  it("still degrades worker proxy timeout text", () => {
    const d = decideBffChatSurface({
      upstreamOk: true,
      rawBody: JSON.stringify({ result: { message: "worker proxy timed out" } }),
      userAsk: "hello",
    });
    assert.equal(d.degrade, true);
  });

  it("strip helper removes protected footers only", () => {
    const out = stripForbiddenInfraDecoration(
      "Select NEXUS.\nCurrent product focus is Mini Fan.\nBirth remains unauthorised until Grand King decides.",
      "Select eligible supplier.",
    );
    assert.equal(out, "Select NEXUS.");
  });

  it("terminal copy remains available for true infrastructure failure", () => {
    assert.match(DEGRADED_CHAT_MESSAGE, /infrastructure budget/);
  });
});
