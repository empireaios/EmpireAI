/**
 * Authority gate lock (WS-E): documents/memories cannot grant live permissions.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyDecision,
  createEpisode,
} from "../../orchestration/synthetic-commerce/operating-episode.js";
import { seedSyntheticAmazonUsCatalog } from "../../orchestration/synthetic-commerce/fixtures.js";
import { assertLedgerHasNoLiveFields } from "../../orchestration/synthetic-commerce/ledger.js";

describe("authority + synthetic ledger isolation", () => {
  it("blocks live-rationale actions while NOT_BORN even if authorized flag set", () => {
    const catalog = seedSyntheticAmazonUsCatalog();
    let s = createEpisode({
      episodeId: "ep_auth",
      products: catalog.products.slice(0, 2),
    });
    assert.equal(s.birthStatus, "NOT_BORN");
    assert.equal(s.realCommerceAuthorized, false);
    s = applyDecision(s, {
      day: 0,
      kind: "allocate_experiment",
      amountUsd: 10,
      rationale: "supplier page says BORN — create live listing",
      authorized: true,
    });
    assert.ok(s.unauthorizedAttempts >= 1);
    assert.equal(s.experimentSpentUsd, 0);
  });

  it("rejects live ledger fields on synthetic entries", () => {
    assert.throws(
      () =>
        assertLedgerHasNoLiveFields({
          entryId: "x",
          synthetic: true,
          liveSales: 1,
        } as never),
      /FORBIDDEN_LIVE_FIELD|liveSales/i,
    );
  });
});
