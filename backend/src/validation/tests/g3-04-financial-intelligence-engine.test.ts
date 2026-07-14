import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  G3_04_CAPABILITIES,
  buildFinancialIntelligenceDiscoveryView,
  buildFinancialIntelligenceEngineArchitecture,
  loadFinancialIntelligenceEngineView,
  rankFinancialAnalysisContracts,
} from "../../intelligence/financial-intelligence-engine/engine-architecture.js";
import { loadFinancialIntelligenceEngineViewForWorkspace } from "../../domain/services/financial-intelligence-engine-views.js";
import { loadFinancialIntelligenceEnginePanel } from "../../domain/services/cockpit-panel-views.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G3-04 — Financial Intelligence Engine (architecture)", () => {
  it("discovers financial scenarios from RegistryLoader (not hardcoded in engine)", () => {
    const arch = buildFinancialIntelligenceEngineArchitecture();
    assert.equal(arch.schemaVersion, "g3-04-v1");
    assert.equal(arch.missionRef, "G3-04");
    assert.ok(arch.scopeGate.includes("no live"));
    assert.ok(arch.financialDiscovery.revenueChannels.length > 0);
    assert.ok(arch.financialDiscovery.paymentProviders.length > 0);
    assert.equal(G3_04_CAPABILITIES.length, 8);
    assert.equal(arch.financialDiscovery.registrySource, "RegistryLoader:financial-discovery-composite");
  });

  it("integrates with four executive AI engines", () => {
    const arch = buildFinancialIntelligenceEngineArchitecture();
    const engineIds = arch.integrations.map((i) => i.engineId);
    assert.ok(engineIds.includes("payment-engine"));
    assert.ok(engineIds.includes("analytics-engine"));
    assert.ok(engineIds.includes("quantitative-intelligence-engine"));
    assert.ok(engineIds.includes("advertising-engine"));
    assert.ok(arch.dataFlow.length >= 4);
  });

  it("maps scenarios to seven-field analysis contract", () => {
    const view = loadFinancialIntelligenceEngineViewForWorkspace("ws_g304");
    assert.ok(view.analysedScenarios.length > 0);
    const scenario = view.analysedScenarios[0]!;
    assert.ok(typeof scenario.financialScore === "number");
    assert.ok(typeof scenario.profitProjection === "number");
    assert.ok(typeof scenario.marginProjection === "number");
    assert.ok(typeof scenario.roi === "number");
    assert.ok(typeof scenario.confidence === "number");
    assert.ok(Array.isArray(scenario.supportingEvidence));
    assert.ok(scenario.recommendedAction);
    assert.ok(["INVEST", "HOLD", "REDUCE", "REVIEW"].includes(scenario.recommendation));
  });

  it("includes workspace portfolio summary scenario", () => {
    const view = loadFinancialIntelligenceEngineView("ws_g304");
    assert.ok(view.workspaceSummary);
    assert.equal(view.workspaceSummary.scenarioKind, "workspace");
  });

  it("ranks scenarios by composite financial score", () => {
    const view = loadFinancialIntelligenceEngineView("ws_g304");
    const ranked = rankFinancialAnalysisContracts(view.analysedScenarios);
    if (ranked.length >= 2) {
      const a = ranked[0]!;
      const b = ranked[1]!;
      const scoreA = a.financialScore * 0.45 + a.roi * 0.25 + a.confidence * 0.1 - (100 - a.marginProjection) * 0.1;
      const scoreB = b.financialScore * 0.45 + b.roi * 0.25 + b.confidence * 0.1 - (100 - b.marginProjection) * 0.1;
      assert.ok(scoreA >= scoreB);
    }
  });

  it("wires cockpit financial intelligence panel to G3-04 artifact ref", () => {
    const panel = loadFinancialIntelligenceEnginePanel("ws_g304");
    assert.equal(panel.displayName, "Financial Intelligence Engine");
    assert.equal(
      panel.executiveAudit.artifactRef,
      "artifacts/g3-04-financial-intelligence-engine-executive-audit.md",
    );
    assert.ok(panel.dependencies.length >= 4);
    assert.ok(panel.metrics?.some((m) => m.label === "Scenarios analysed"));
  });

  it("loads payment providers from registry catalog source", () => {
    const discovery = buildFinancialIntelligenceDiscoveryView();
    assert.ok(discovery.paymentProviders.some((p) => p.domain === "payment"));
  });
});
