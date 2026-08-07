import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  EXECUTIVE_NOT_READY_REPLY,
  EXECUTIVE_PIPELINE_SOFT_REPLY,
  EXECUTIVE_RECOVERING_LABEL,
  leaksInternalArchitecture,
  toExecutiveChatMessage,
  toExecutiveSurfaceMessage,
} from "./executive-surface.js";

describe("executive surface language", () => {
  test("detects infrastructure leaks", () => {
    assert.equal(
      leaksInternalArchitecture(
        "Constitutional gate: Pillow executive pipeline unavailable. Brain assistant fallback is disabled.",
      ),
      true,
    );
    assert.equal(leaksInternalArchitecture("Sustainable profit remains the supreme directive."), false);
  });

  test("rewrites leaks to executive recovering language", () => {
    const out = toExecutiveSurfaceMessage(
      "Restore the Pillow host session and retry. Digital Soul unavailable.",
    );
    assert.equal(out, EXECUTIVE_RECOVERING_LABEL);
    assert.equal(leaksInternalArchitecture(out), false);
  });

  test("chat sanitizer never surfaces architecture", () => {
    const out = toExecutiveChatMessage(
      "Constitutional gate: No constitutionally gated LLM provider is available.",
    );
    assert.equal(out, EXECUTIVE_PIPELINE_SOFT_REPLY);
    assert.equal(leaksInternalArchitecture(out), false);
  });

  test("not-ready reply never leaks architecture", () => {
    assert.equal(leaksInternalArchitecture(EXECUTIVE_NOT_READY_REPLY), false);
  });
});
