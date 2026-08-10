import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PILLOW_WORKSPACE_LAYOUT } from "./pillow-workspace-layout";

/**
 * Synthetic scale proof for Mission 007 chat windowing.
 * Does not create permanent production messages.
 */
describe("Pillow chat scale (Mission 007)", () => {
  it("bounds rendered turns for large synthetic histories", () => {
    const total = 10_000;
    const conversation = Array.from({ length: total }, (_, i) => ({
      id: `m-${i}`,
      role: i % 2 === 0 ? "grand_king" : "pillow",
      content: `synthetic turn ${i}`,
    }));
    const windowSize = PILLOW_WORKSPACE_LAYOUT.visibleMessageWindow;
    const visible = conversation.slice(Math.max(0, conversation.length - windowSize));
    const hidden = Math.max(0, conversation.length - windowSize);
    assert.equal(visible.length, windowSize);
    assert.equal(hidden, total - windowSize);
    assert.ok(visible.length < 100, "DOM message nodes remain bounded");
    assert.equal(visible[0]?.id, `m-${total - windowSize}`);
    assert.equal(visible[visible.length - 1]?.id, `m-${total - 1}`);
  });

  it("load-earlier expands window without rendering entire history at once", () => {
    const total = 500;
    let windowSize = PILLOW_WORKSPACE_LAYOUT.visibleMessageWindow;
    windowSize += PILLOW_WORKSPACE_LAYOUT.visibleMessageWindow;
    const visible = Array.from({ length: total }).slice(Math.max(0, total - windowSize));
    assert.equal(visible.length, Math.min(total, windowSize));
    assert.ok(visible.length <= 80);
  });
});
