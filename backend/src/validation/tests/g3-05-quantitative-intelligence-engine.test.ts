import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  G3_05_CAPABILITIES,
  buildQuantitativeDiscoveryView,
  buildQuantitativeIntelligenceEngineArchitecture,
  loadQuantitativeIntelligenceEngineView,
} from "../../intelligence/quantitative-intelligence-engine/engine-architecture.js";
import { loadQuantitativeIntelligenceEngineViewForWorkspace } from "../../domain/services/quantitative-intelligence-engine-views.js";
import { loadQuantitativeIntelligenceEnginePanel } from "../../domain/services/cockpit-panel-views.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G3-05 — Quantitative Intelligence Engine (architecture)", () => {
  it("defines mathematics-only decision policy", () => {
    const arch = buildQuantitativeIntelligenceEngineArchitecture();
    assert.equal(arch.schemaVersion, "g3-05-v1");
    assert.equal(arch.missionRef, "G3-05");
    assert.equal(arch.decisionPolicy, "mathematics_only_no_executive_decisions");
    assert.ok(arch.scopeGate.includes("no executive decisions"));
    assert.equal(G3_05_CAPABILITIES.length, 8);
  });

  it("discovers model scope from RegistryLoader", () => {
    const discovery = buildQuantitativeDiscoveryView();
    assert.equal(discovery.registrySource, "RegistryLoader:quantitative-discovery-composite");
    assert.ok(discovery.discoveryChannelCount > 0);
    assert.ok(Array.isArray(discovery.scoringPolicyRows));
  });

  it("integrates with four G3 engines as mathematical input feeds", () => {
    const arch = buildQuantitativeIntelligenceEngineArchitecture();
    const engineIds = arch.integrations.map((i) => i.engineId);
    assert.ok(engineIds.includes("product-intelligence-engine"));
    assert.ok(engineIds.includes("market-intelligence-engine"));
    assert.ok(engineIds.includes("supplier-intelligence-engine"));
    assert.ok(engineIds.includes("financial-intelligence-engine"));
    assert.ok(arch.integrations.every((i) => i.relationship === "feeds"));
  });

  it("maps every model result to five-field contract without executive decision", () => {
    const view = loadQuantitativeIntelligenceEngineViewForWorkspace("ws_g305");
    assert.equal(view.modelResults.length, 8);
    for (const result of view.modelResults) {
      assert.ok(result.model);
      assert.ok(typeof result.inputs === "object");
      assert.ok(typeof result.outputs === "object");
      assert.ok(typeof result.confidence === "number");
      assert.ok(Array.isArray(result.supportingEvidence));
      assert.ok(!("recommendation" in result));
      assert.ok(!("recommendedAction" in result));
    }
  });

  it("runs all eight mathematical model kinds", () => {
    const view = loadQuantitativeIntelligenceEngineView("ws_g305");
    const kinds = view.modelResults.map((r) => r.modelKind);
    assert.ok(kinds.includes("statistical_modelling"));
    assert.ok(kinds.includes("predictive_modelling"));
    assert.ok(kinds.includes("forecasting"));
    assert.ok(kinds.includes("probability"));
    assert.ok(kinds.includes("optimisation"));
    assert.ok(kinds.includes("sensitivity_analysis"));
    assert.ok(kinds.includes("simulation"));
    assert.ok(kinds.includes("confidence_modelling"));
  });

  it("produces deterministic simulation for same workspace", () => {
    const a = loadQuantitativeIntelligenceEngineView("ws_g305");
    const b = loadQuantitativeIntelligenceEngineView("ws_g305");
    const simA = a.modelResults.find((r) => r.modelKind === "simulation")!;
    const simB = b.modelResults.find((r) => r.modelKind === "simulation")!;
    assert.equal(simA.outputs.simulatedMean, simB.outputs.simulatedMean);
  });

  it("wires cockpit quantitative intelligence panel to G3-05 artifact ref", () => {
    const panel = loadQuantitativeIntelligenceEnginePanel("ws_g305");
    assert.equal(panel.displayName, "Quantitative Intelligence Engine");
    assert.equal(
      panel.executiveAudit.artifactRef,
      "artifacts/g3-05-quantitative-intelligence-engine-executive-audit.md",
    );
    assert.ok(panel.dependencies.length >= 4);
    assert.ok(panel.metrics?.some((m) => m.label === "Models computed"));
    assert.equal(panel.implemented, true);
  });
});
