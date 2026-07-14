import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  G3_02_CAPABILITIES,
  buildMarketIntelligenceEngineArchitecture,
  loadMarketIntelligenceEngineView,
  rankMarketAnalysisContracts,
  buildMarketplaceComparison,
} from "../../intelligence/market-intelligence-engine/engine-architecture.js";
import { loadMarketIntelligenceEngineViewForWorkspace } from "../../domain/services/market-intelligence-engine-views.js";
import { loadMarketIntelligenceEnginePanel } from "../../domain/services/cockpit-panel-views.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G3-02 — Market Intelligence Engine (architecture)", () => {
  it("discovers markets from RegistryLoader (not hardcoded in engine)", () => {
    const arch = buildMarketIntelligenceEngineArchitecture();
    assert.equal(arch.schemaVersion, "g3-02-v1");
    assert.equal(arch.missionRef, "G3-02");
    assert.ok(arch.scopeGate.includes("no live API"));
    assert.ok(arch.marketDiscovery.countries.length > 0);
    assert.ok(arch.marketDiscovery.intelligenceSources.length > 0);
    assert.equal(G3_02_CAPABILITIES.length, 10);
    assert.equal(arch.marketDiscovery.registrySource, "RegistryLoader:DERIVED-DISCOVERY-SNAPSHOT");
  });

  it("integrates with five executive AI engines including Product Intelligence", () => {
    const arch = buildMarketIntelligenceEngineArchitecture();
    const engineIds = arch.integrations.map((i) => i.engineId);
    assert.ok(engineIds.includes("product-intelligence-engine"));
    assert.ok(engineIds.includes("marketplace-engine"));
    assert.ok(engineIds.includes("quantitative-intelligence-engine"));
    assert.ok(engineIds.includes("advertising-engine"));
    assert.ok(engineIds.includes("analytics-engine"));
    assert.ok(arch.dataFlow.length >= 5);
  });

  it("maps registry markets to eight-field analysis contract", () => {
    const view = loadMarketIntelligenceEngineViewForWorkspace("ws_g302");
    assert.ok(view.analysedMarkets.length > 0);
    const market = view.analysedMarkets[0]!;
    assert.ok(typeof market.opportunityScore === "number");
    assert.ok(typeof market.growthScore === "number");
    assert.ok(typeof market.competitionScore === "number");
    assert.ok(typeof market.saturationScore === "number");
    assert.ok(typeof market.riskScore === "number");
    assert.ok(typeof market.confidence === "number");
    assert.ok(Array.isArray(market.supportingEvidence));
    assert.ok(market.recommendedAction);
    assert.ok(["ENTER", "WATCH", "AVOID", "EXPAND"].includes(market.recommendation));
  });

  it("ranks markets by composite opportunity score", () => {
    const view = loadMarketIntelligenceEngineView();
    const ranked = rankMarketAnalysisContracts(view.analysedMarkets);
    if (ranked.length >= 2) {
      const a = ranked[0]!;
      const b = ranked[1]!;
      const scoreA = a.opportunityScore * 0.45 + a.growthScore * 0.25 + a.confidence * 0.1 - a.riskScore * 0.2;
      const scoreB = b.opportunityScore * 0.45 + b.growthScore * 0.25 + b.confidence * 0.1 - b.riskScore * 0.2;
      assert.ok(scoreA >= scoreB);
    }
  });

  it("builds marketplace comparison board from scored markets", () => {
    const view = loadMarketIntelligenceEngineView();
    const comparison = buildMarketplaceComparison(view.analysedMarkets);
    assert.equal(comparison.length, view.analysedMarkets.length);
    assert.equal(comparison[0]?.rank, 1);
  });

  it("wires cockpit market intelligence panel to G3-02 artifact ref", () => {
    const panel = loadMarketIntelligenceEnginePanel("ws_g302");
    assert.equal(panel.displayName, "Market Intelligence Engine");
    assert.equal(
      panel.executiveAudit.artifactRef,
      "artifacts/g3-02-market-intelligence-engine-executive-audit.md",
    );
    assert.ok(panel.dependencies.length >= 5);
    assert.ok(panel.metrics?.some((m) => m.label === "Markets analysed"));
  });

  it("analyses both country and channel markets from discovery snapshot", () => {
    const view = loadMarketIntelligenceEngineView();
    assert.ok(view.countryMarkets.length > 0);
    assert.ok(view.channelMarkets.length > 0);
    assert.ok(view.countryMarkets.every((m) => m.marketKind === "country"));
    assert.ok(view.channelMarkets.every((m) => m.marketKind === "channel"));
  });
});
