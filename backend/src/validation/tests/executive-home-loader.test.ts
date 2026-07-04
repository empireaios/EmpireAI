import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  clearExecutiveHomeViewCache,
  loadExecutiveHomeForDispatch,
} from "../../domain/services/executive-home-loader.js";

describe("Executive home async loader", () => {
  it("loads executive home without blocking and returns trace metadata", async () => {
    clearExecutiveHomeViewCache();
    const result = await loadExecutiveHomeForDispatch("ws_test");
    assert.ok(result.command);
    assert.ok(result.portfolio);
    assert.ok(result._trace);
    assert.ok(typeof result._trace!.totalMs === "number");
    if (!result._fallback) {
      assert.equal(result.engineSummaries.length, 7);
    }
  });

  it("serves cached view on second request", async () => {
    clearExecutiveHomeViewCache();
    await loadExecutiveHomeForDispatch("ws_test");
    const cached = await loadExecutiveHomeForDispatch("ws_test");
    assert.equal(cached._cached, true);
  });
});
