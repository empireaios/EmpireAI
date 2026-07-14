import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  G3_06_CAPABILITIES,
  buildAdvertisingIntelligenceDiscoveryView,
  buildAdvertisingIntelligenceEngineArchitecture,
  loadAdvertisingIntelligenceEngineView,
  rankAdvertisingAnalysisContracts,
  resolveRegistryDiscoveredCampaigns,
} from "../../intelligence/advertising-intelligence-engine/engine-architecture.js";
import { loadAdvertisingIntelligenceEngineViewForWorkspace } from "../../domain/services/advertising-intelligence-engine-views.js";
import { loadAdvertisingIntelligenceEnginePanel } from "../../domain/services/cockpit-panel-views.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G3-06 — Advertising Intelligence Engine (architecture)", () => {
  it("discovers ad platforms from RegistryLoader (not hardcoded in engine)", () => {
    const arch = buildAdvertisingIntelligenceEngineArchitecture();
    assert.equal(arch.schemaVersion, "g3-06-v1");
    assert.equal(arch.missionRef, "G3-06");
    assert.ok(arch.scopeGate.includes("no live"));
    assert.ok(arch.advertisingDiscovery.advertisingProviders.length >= 2);
    assert.ok(arch.advertisingDiscovery.advertisingCountries.length > 0);
    assert.equal(G3_06_CAPABILITIES.length, 8);
  });

  it("integrates with four executive AI engines", () => {
    const arch = buildAdvertisingIntelligenceEngineArchitecture();
    const engineIds = arch.integrations.map((i) => i.engineId);
    assert.ok(engineIds.includes("advertising-engine"));
    assert.ok(engineIds.includes("financial-intelligence-engine"));
    assert.ok(engineIds.includes("quantitative-intelligence-engine"));
    assert.ok(engineIds.includes("analytics-engine"));
  });

  it("maps campaigns to analysis contract with ROAS and CAC", () => {
    const view = loadAdvertisingIntelligenceEngineViewForWorkspace("ws_g306");
    assert.ok(view.analysedCampaigns.length > 0);
    const campaign = view.analysedCampaigns[0]!;
    assert.ok(typeof campaign.advertisingScore === "number");
    assert.ok(typeof campaign.roas === "number");
    assert.ok(typeof campaign.cacScore === "number");
    assert.ok(typeof campaign.budgetAllocationScore === "number");
    assert.ok(typeof campaign.scalingScore === "number");
    assert.ok(typeof campaign.confidence === "number");
    assert.ok(Array.isArray(campaign.supportingEvidence));
    assert.ok(campaign.recommendedAction);
    assert.ok(["SCALE", "MAINTAIN", "PAUSE", "TEST"].includes(campaign.recommendation));
  });

  it("includes registry architecture campaigns when domain store empty", () => {
    const discovery = buildAdvertisingIntelligenceDiscoveryView();
    const units = resolveRegistryDiscoveredCampaigns("ws_empty_g306", discovery);
    assert.ok(units.some((u) => u.source === "registry-architecture"));
  });

  it("ranks campaigns by composite advertising score", () => {
    const view = loadAdvertisingIntelligenceEngineView("ws_g306");
    const ranked = rankAdvertisingAnalysisContracts(view.analysedCampaigns);
    if (ranked.length >= 2) {
      const a = ranked[0]!;
      const b = ranked[1]!;
      const scoreA = a.advertisingScore * 0.4 + a.roas * 10 + a.scalingScore * 0.2 - (100 - a.cacScore) * 0.1;
      const scoreB = b.advertisingScore * 0.4 + b.roas * 10 + b.scalingScore * 0.2 - (100 - b.cacScore) * 0.1;
      assert.ok(scoreA >= scoreB);
    }
  });

  it("wires cockpit advertising intelligence panel to G3-06 artifact ref", () => {
    const panel = loadAdvertisingIntelligenceEnginePanel("ws_g306");
    assert.equal(panel.displayName, "Advertising Intelligence Engine");
    assert.equal(
      panel.executiveAudit.artifactRef,
      "artifacts/g3-06-advertising-intelligence-engine-executive-audit.md",
    );
    assert.ok(panel.dependencies.length >= 4);
    assert.ok(panel.metrics?.some((m) => m.label === "Campaigns analysed"));
  });

  it("loads Meta and Google from advertising registry catalog", () => {
    const discovery = buildAdvertisingIntelligenceDiscoveryView();
    const ids = discovery.advertisingProviders.map((p) => p.providerId);
    assert.ok(ids.includes("meta-ads-global"));
    assert.ok(ids.includes("google-ads-global"));
  });
});
