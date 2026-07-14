import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  G3_10_CAPABILITIES,
  G3_10_CONSUMER_CHANNELS,
  G3_10_SUITE_ENGINE_REFS,
  buildExecutiveIntelligenceOrchestratorArchitecture,
  buildExecutiveIntelligenceUnifiedService,
  coordinateExecutiveEngines,
  loadExecutiveIntelligenceOrchestratorView,
} from "../../intelligence/executive-intelligence-orchestrator/engine-architecture.js";
import { loadExecutiveIntelligenceOrchestratorViewForWorkspace } from "../../domain/services/executive-intelligence-orchestrator-views.js";
import { loadExecutiveIntelligenceOrchestratorPanel } from "../../domain/services/cockpit-panel-views.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G3-10 — Executive Intelligence Orchestrator (architecture)", () => {
  it("declares G3 suite complete with nine coordinated engines", () => {
    const arch = buildExecutiveIntelligenceOrchestratorArchitecture();
    assert.equal(arch.schemaVersion, "g3-10-v1");
    assert.equal(arch.missionRef, "G3-10");
    assert.equal(arch.orchestrationPolicy, "no_business_logic");
    assert.ok(arch.scopeGate.includes("no business logic"));
    assert.equal(arch.suiteEngines.length, 9);
    assert.equal(G3_10_SUITE_ENGINE_REFS.length, 9);
    assert.equal(G3_10_CAPABILITIES.length, 8);
  });

  it("delivers unified service to five consumer channels", () => {
    const service = buildExecutiveIntelligenceUnifiedService("ws_g310");
    assert.equal(service.orchestrationPolicy, "no_business_logic");
    assert.equal(service.consumerDeliveries.length, 5);
    for (const channel of G3_10_CONSUMER_CHANNELS) {
      assert.ok(service.consumerDeliveries.some((d) => d.consumerId === channel));
    }
  });

  it("coordinates engines without business logic fields", () => {
    const coordinated = coordinateExecutiveEngines("ws_g310");
    assert.equal(coordinated.length, 9);
    for (const engine of coordinated) {
      assert.equal(engine.orchestrationOnly, true);
      assert.ok(engine.executiveSummary);
      assert.ok(engine.missionRef.startsWith("G3-"));
    }
  });

  it("aggregates G3-09 decision snapshot into unified service", () => {
    const view = loadExecutiveIntelligenceOrchestratorViewForWorkspace("ws_g310");
    const snap = view.unifiedService.decisionSnapshot;
    assert.ok(snap.finalRecommendation);
    assert.ok(typeof snap.decisionConfidence === "number");
    assert.ok(snap.executiveRecommendation);
    assert.ok(snap.reasoningSummary);
    assert.ok(view.unifiedService.scheduleSlots.length >= 4);
  });

  it("marks all consumer deliveries as orchestration-only", () => {
    const view = loadExecutiveIntelligenceOrchestratorView("ws_g310");
    for (const delivery of view.unifiedService.consumerDeliveries) {
      assert.equal(delivery.orchestrationOnly, true);
      assert.ok(delivery.bridgeModule);
    }
  });

  it("wires cockpit orchestrator panel to G3-10 artifact ref", () => {
    const panel = loadExecutiveIntelligenceOrchestratorPanel("ws_g310");
    assert.equal(panel.displayName, "Executive Intelligence Orchestrator");
    assert.equal(
      panel.executiveAudit.artifactRef,
      "artifacts/g3-10-executive-intelligence-orchestrator-executive-audit.md",
    );
    assert.ok(panel.metrics?.some((m) => m.label === "Consumer channels"));
  });

  it("includes business-automation channel with decision gate payload", () => {
    const service = buildExecutiveIntelligenceUnifiedService("ws_g310");
    const automation = service.consumerDeliveries.find((d) => d.consumerId === "business-automation");
    assert.ok(automation);
    assert.equal(automation.deliveryMode, "schedule-manifest");
    assert.ok(automation.recommendedAction.includes("automation") || automation.recommendedAction.includes("Automation"));
  });
});
