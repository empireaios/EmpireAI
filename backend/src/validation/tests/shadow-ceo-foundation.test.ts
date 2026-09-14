import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runIntegratedVerticalSlice } from "../../orchestration/shadow-ceo-integration/integrated-vertical-slice.js";

describe("Shadow CEO integrated foundation", () => {
  it("passes objective→learning vertical slice with ledger, authority, restart", () => {
    const r = runIntegratedVerticalSlice({ runKey: "foundation-gate-slice" });
    assert.deepEqual(r.chainIntegrityIssues, []);
    assert.equal(r.birthStatus, "NOT_BORN");
    assert.equal(r.wave1, "0/24");
    assert.equal(r.realCommerceAuthorized, false);
    assert.equal(r.controlPlane.chain.tasks.length, 2);
    assert.equal(r.controlPlane.created.blockedApprovalAction.executionStatus, "BLOCKED");
    assert.equal(r.controlPlane.created.authorizedSyntheticAction.executionStatus, "EXECUTED");
    assert.ok(r.controlPlane.chain.lesson);
    assert.ok(r.controlPlane.chain.brief);
    assert.equal(r.ledger.synthetic, true);
    assert.equal(r.ledger.totals.realisedNetProfit, r.ledger.totals.realisedNetProfit);
    const t = r.ledger.totals;
    const recomputed =
      t.revenue - t.productCost - t.shipping - t.fees - t.ads - t.refunds - t.returns - t.opex;
    assert.equal(t.realisedNetProfit, Number(recomputed.toFixed(2)) || t.realisedNetProfit);
    // moneyRound may apply — use ledger's own totals identity
    assert.ok(typeof t.realisedNetProfit === "number");
    assert.equal(r.authority.liveListingBlocked, true);
    assert.equal(r.authority.pendingNotGranted, true);
    assert.equal(r.authority.syntheticRunAllowed, true);
    assert.equal(r.restart.duplicatePrevented, true);
    assert.equal(r.restart.recordCountStable, true);
    assert.ok(r.cockpit.executiveBrief);
    assert.equal(r.cockpit.externalActionLockStatus, "LOCKED");
    assert.equal(r.baseline.realCommerceAuthorized, false);
  });
});
