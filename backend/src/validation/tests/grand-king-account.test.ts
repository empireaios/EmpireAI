import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  seedGrandKingAccount,
  buildGrandKingAccountDashboard,
  runGrandKingAutomationJob,
  resetGrandKingRepository,
  GRAND_KING_WORKSPACE_ID,
} from "../../grand-king/index.js";
import { configureValidationEnvironment } from "../harness.js";

describe("Grand King Account", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGrandKingRepository();
  });

  afterEach(() => {
    resetGrandKingRepository();
    resetDatabaseInstance();
  });

  it("seeds products, tasks, suppliers, orders, and AI decisions", () => {
    seedGrandKingAccount(GRAND_KING_WORKSPACE_ID);
    seedGrandKingAccount(GRAND_KING_WORKSPACE_ID); // idempotent

    const dash = buildGrandKingAccountDashboard(GRAND_KING_WORKSPACE_ID);
    assert.equal(dash.accountId, "grand-king");
    assert.ok(dash.products.length >= 3);
    assert.ok(dash.tasks.length >= 4);
    assert.ok(dash.suppliers.length >= 2);
    assert.ok(dash.orders.length >= 2);
    assert.ok(dash.aiDecisions.length >= 3);
    assert.ok(dash.summary.pendingDecisions >= 1);
  });

  it("dashboard summary reflects Grand King account state", () => {
    seedGrandKingAccount(GRAND_KING_WORKSPACE_ID);
    const dash = buildGrandKingAccountDashboard(GRAND_KING_WORKSPACE_ID);

    assert.equal(dash.summary.productCount, dash.products.length);
    assert.ok(dash.summary.pendingTasks >= 1);
    assert.equal(dash.companyId, "co-grand-king");
  });

  it("automation jobs run for Grand King only", async () => {
    seedGrandKingAccount(GRAND_KING_WORKSPACE_ID);
    const sync = await runGrandKingAutomationJob("grand-king-morning-sync");
    assert.equal(sync.ok, true);

    const surveillance = await runGrandKingAutomationJob("grand-king-surveillance");
    assert.equal(surveillance.ok, true);
  });
});
