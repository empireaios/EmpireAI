import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  G3_07_CAPABILITIES,
  buildCustomerIntelligenceDiscoveryView,
  buildCustomerIntelligenceEngineArchitecture,
  loadCustomerIntelligenceEngineView,
  rankCustomerAnalysisContracts,
  resolveRegistryDiscoveredCustomers,
} from "../../intelligence/customer-intelligence-engine/engine-architecture.js";
import { loadCustomerIntelligenceEngineViewForWorkspace } from "../../domain/services/customer-intelligence-engine-views.js";
import { loadCustomerIntelligenceEnginePanel } from "../../domain/services/cockpit-panel-views.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G3-07 — Customer Intelligence Engine (architecture)", () => {
  it("discovers customer platforms from RegistryLoader (not hardcoded in engine)", () => {
    const arch = buildCustomerIntelligenceEngineArchitecture();
    assert.equal(arch.schemaVersion, "g3-07-v1");
    assert.equal(arch.missionRef, "G3-07");
    assert.ok(arch.scopeGate.includes("no live"));
    assert.ok(arch.customerDiscovery.customerServiceProviders.length >= 2);
    assert.ok(arch.customerDiscovery.marketplaceSegments.length > 0);
    assert.equal(G3_07_CAPABILITIES.length, 8);
  });

  it("integrates with Marketplace, Analytics, and Advertising engines", () => {
    const arch = buildCustomerIntelligenceEngineArchitecture();
    const engineIds = arch.integrations.map((i) => i.engineId);
    assert.ok(engineIds.includes("marketplace-engine"));
    assert.ok(engineIds.includes("analytics-engine"));
    assert.ok(engineIds.includes("advertising-engine"));
  });

  it("maps customers to analysis contract with LTV and churn scores", () => {
    const view = loadCustomerIntelligenceEngineViewForWorkspace("ws_g307");
    assert.ok(view.analysedCustomers.length > 0);
    const customer = view.analysedCustomers[0]!;
    assert.ok(typeof customer.customerScore === "number");
    assert.ok(typeof customer.segmentationScore === "number");
    assert.ok(typeof customer.behaviourScore === "number");
    assert.ok(typeof customer.journeyScore === "number");
    assert.ok(typeof customer.retentionScore === "number");
    assert.ok(typeof customer.churnRiskScore === "number");
    assert.ok(typeof customer.ltvScore === "number");
    assert.ok(typeof customer.satisfactionScore === "number");
    assert.ok(typeof customer.confidence === "number");
    assert.ok(Array.isArray(customer.supportingEvidence));
    assert.ok(customer.recommendedAction);
    assert.ok(["RETAIN", "ENGAGE", "WIN_BACK", "MONITOR"].includes(customer.recommendation));
  });

  it("includes registry architecture segments when domain store empty", () => {
    const discovery = buildCustomerIntelligenceDiscoveryView();
    const units = resolveRegistryDiscoveredCustomers("ws_empty_g307", discovery);
    assert.ok(units.some((u) => u.source === "registry-architecture"));
  });

  it("ranks customers by composite customer score", () => {
    const view = loadCustomerIntelligenceEngineView("ws_g307");
    const ranked = rankCustomerAnalysisContracts(view.analysedCustomers);
    if (ranked.length >= 2) {
      const a = ranked[0]!;
      const b = ranked[1]!;
      const scoreA = a.customerScore * 0.4 + a.ltvScore * 0.3 + a.retentionScore * 0.2 - a.churnRiskScore * 0.1;
      const scoreB = b.customerScore * 0.4 + b.ltvScore * 0.3 + b.retentionScore * 0.2 - b.churnRiskScore * 0.1;
      assert.ok(scoreA >= scoreB);
    }
  });

  it("wires cockpit customer intelligence panel to G3-07 artifact ref", () => {
    const panel = loadCustomerIntelligenceEnginePanel("ws_g307");
    assert.equal(panel.displayName, "Customer Intelligence Engine");
    assert.equal(
      panel.executiveAudit.artifactRef,
      "artifacts/g3-07-customer-intelligence-engine-executive-audit.md",
    );
    assert.ok(panel.dependencies.length >= 3);
    assert.ok(panel.metrics?.some((m) => m.label === "Customers analysed"));
  });

  it("loads Zendesk and Intercom from customer registry catalog", () => {
    const discovery = buildCustomerIntelligenceDiscoveryView();
    const ids = discovery.customerServiceProviders.map((p) => p.providerId);
    assert.ok(ids.includes("zendesk-global"));
    assert.ok(ids.includes("intercom-global"));
  });
});
