import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  G3_09_CAPABILITIES,
  G3_09_EXECUTIVE_ENGINE_IDS,
  buildDecisionIntelligenceDiscoveryView,
  buildDecisionIntelligenceEngineArchitecture,
  collectExecutiveEngineFeeds,
  loadDecisionIntelligenceEngineView,
  synthesizeDecisionContract,
} from "../../intelligence/decision-intelligence-engine/engine-architecture.js";
import { loadDecisionIntelligenceEngineViewForWorkspace } from "../../domain/services/decision-intelligence-engine-views.js";
import { loadDecisionIntelligenceEnginePanel } from "../../domain/services/cockpit-panel-views.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G3-09 — Decision Intelligence Engine (architecture)", () => {
  it("discovers executive engines from Brain catalog (not hardcoded list)", () => {
    const arch = buildDecisionIntelligenceEngineArchitecture();
    assert.equal(arch.schemaVersion, "g3-09-v1");
    assert.equal(arch.missionRef, "G3-09");
    assert.equal(arch.orchestrationPolicy, "never_calculates_raw_data");
    assert.ok(arch.scopeGate.includes("never calculates raw data"));
    assert.equal(arch.decisionDiscovery.executiveEngines.length, 8);
    assert.equal(G3_09_CAPABILITIES.length, 9);
  });

  it("consumes all eight G3 executive intelligence engines", () => {
    const arch = buildDecisionIntelligenceEngineArchitecture();
    const engineIds = arch.integrations.map((i) => i.engineId);
    for (const id of G3_09_EXECUTIVE_ENGINE_IDS) {
      assert.ok(engineIds.includes(id));
    }
    assert.equal(arch.integrations.length, 8);
  });

  it("produces decision contract with final recommendation and confidence", () => {
    const view = loadDecisionIntelligenceEngineViewForWorkspace("ws_g309");
    const decision = view.decision;
    assert.ok(decision.decisionId);
    assert.ok(typeof decision.decisionConfidence === "number");
    assert.ok(decision.reasoningSummary);
    assert.ok(decision.executiveRecommendation);
    assert.ok(Array.isArray(decision.supportingEvidence));
    assert.ok(
      ["PROCEED", "PROCEED_WITH_CAUTION", "HOLD", "PIVOT", "STOP"].includes(decision.finalRecommendation),
    );
    assert.equal(decision.engineFeeds.length, 8);
  });

  it("marks every engine feed as orchestration-only", () => {
    const feeds = collectExecutiveEngineFeeds("ws_g309");
    assert.equal(feeds.length, 8);
    for (const feed of feeds) {
      assert.equal(feed.orchestrationOnly, true);
    }
  });

  it("never emits raw data fields — only orchestrated signals", () => {
    const decision = synthesizeDecisionContract("ws_g309");
    const keys = Object.keys(decision);
    assert.ok(keys.includes("finalRecommendation"));
    assert.ok(keys.includes("decisionConfidence"));
    assert.ok(keys.includes("reasoningSummary"));
    assert.ok(keys.includes("supportingEvidence"));
    assert.ok(keys.includes("executiveRecommendation"));
    assert.ok(!keys.includes("rawScore"));
    assert.ok(!keys.includes("marginProjection"));
  });

  it("wires cockpit decision intelligence panel to G3-09 artifact ref", () => {
    const panel = loadDecisionIntelligenceEnginePanel("ws_g309");
    assert.equal(panel.displayName, "Decision Intelligence Engine");
    assert.equal(
      panel.executiveAudit.artifactRef,
      "artifacts/g3-09-decision-intelligence-engine-executive-audit.md",
    );
    assert.ok(panel.dependencies.length >= 8);
    assert.ok(panel.metrics?.some((m) => m.label === "Final recommendation"));
  });

  it("loads executive engine roster from INTELLIGENCE_MODULE_CATALOG", () => {
    const discovery = buildDecisionIntelligenceDiscoveryView();
    const ids = discovery.executiveEngines.map((e) => e.moduleId);
    assert.ok(ids.includes("product-intelligence"));
    assert.ok(ids.includes("risk-intelligence"));
  });
});
