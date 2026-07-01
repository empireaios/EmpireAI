import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

import { configureValidationEnvironment } from "../../validation/harness.js";
import { seedDomainData } from "../../domain/seed.js";
import { loadDashboardView, loadFinanceView, loadOrdersView } from "../../domain/services/module-views.js";
import { moduleLoadTools } from "../../agents/tools/module-load-tools.js";
import { moduleRoutes } from "../../agents/routes/module-routes.js";

const WORKSPACE_ID = "ws_empire_1";

/** REAL-135 — Cockpit Grand King revenue path smoke (architecture validation). */
describe("REAL-135 Cockpit Grand King revenue smoke", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    seedDomainData();
  });

  it("registers ledger and fulfillment module load routes for Cockpit", () => {
    const toolNames = moduleLoadTools.map((tool) => tool.name);
    assert.ok(toolNames.includes("dashboard.load_view"));
    assert.ok(toolNames.includes("finance.load_view"));
    assert.ok(toolNames.includes("orders.load_view"));
    assert.ok(toolNames.includes("integrations.load_view"));

    const routes = moduleRoutes.map((route) => `${route.module}.${route.action}`);
    assert.ok(routes.includes("orders.prepare_fulfillment_from_manufacturing_run"));
    assert.ok(routes.includes("live-cj-fulfillment.submit_live"));
    assert.ok(routes.includes("revenue-loop.submit_live_fulfillment"));
  });

  it("returns ledger-backed portfolio metrics for Executive Home KPI strip", () => {
    const dashboard = loadDashboardView(WORKSPACE_ID);
    assert.ok(dashboard.portfolioMetrics.length >= 3);
    assert.match(dashboard.portfolioMetrics[0]?.value ?? "", /\$|%/);

    const finance = loadFinanceView(WORKSPACE_ID);
    assert.ok(finance.metrics.length >= 2);
    assert.ok(finance.breakdown.revenue);

    const orders = loadOrdersView(WORKSPACE_ID);
    assert.ok(orders.metrics.length >= 3);
  });
});
