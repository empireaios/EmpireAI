import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { configureValidationEnvironment } from "../harness.js";
import { INTEGRATIONS_HUB_CATALOG } from "../../operational-access/integrations-hub/models/integrations-hub-catalog.js";
import { buildIntegrationsHubDashboard } from "../../operational-access/integrations-hub/services/integrations-hub-service.js";

const WORKSPACE = "ws_empire_1";

describe("Integrations Hub (IH-001 · UX-024)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it("IH-001 — catalog includes all required categories", () => {
    const categories = new Set(INTEGRATIONS_HUB_CATALOG.map((d) => d.category));
    const required = [
      "marketplaces",
      "suppliers",
      "ecommerce",
      "payments",
      "advertising",
      "analytics",
      "communication",
      "ai_providers",
    ] as const;
    for (const requiredCat of required) {
      assert.ok(categories.has(requiredCat), `missing category ${requiredCat}`);
    }
    assert.ok(INTEGRATIONS_HUB_CATALOG.length >= 28);
  });

  it("IH-001 — dashboard builds with summary and doctrine ref", () => {
    const dashboard = buildIntegrationsHubDashboard(WORKSPACE);
    assert.equal(dashboard.missionId, "IH-001");
    assert.equal(dashboard.doctrineRef, "REAL-051A");
    assert.equal(dashboard.summary.total, INTEGRATIONS_HUB_CATALOG.length);
    assert.equal(dashboard.categories.length, 8);
    for (const cat of dashboard.categories) {
      assert.ok(cat.integrations.length > 0);
      for (const item of cat.integrations) {
        assert.equal(item.oneTimeSetup, true);
        assert.ok(item.purpose.length > 0);
        assert.ok(item.whyEmpireNeedsIt.length > 0);
      }
    }
  });

  it("IH-001 — live integrations include Amazon and CJ", () => {
    const ids = INTEGRATIONS_HUB_CATALOG.map((d) => d.integrationId);
    assert.ok(ids.includes("amazon"));
    assert.ok(ids.includes("cj-dropshipping"));
    assert.ok(ids.includes("shopify"));
  });

  it("IH-001 — future integrations marked disabled when not connected", () => {
    const dashboard = buildIntegrationsHubDashboard(WORKSPACE);
    const autods = dashboard.categories
      .flatMap((c) => c.integrations)
      .find((i) => i.integrationId === "autods");
    assert.ok(autods);
    assert.equal(autods.displayStatus, "disabled");
    assert.equal(autods.future, true);
  });
});
