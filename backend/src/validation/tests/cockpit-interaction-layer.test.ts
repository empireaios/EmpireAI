import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildEngineAiInsight,
  handleCockpitInteraction,
  loadCockpitInteractionContext,
  resolveCockpitScreenContext,
} from "../../domain/services/cockpit-interaction-layer.js";
import { loadEnginePanelView } from "../../domain/services/cockpit-panel-views.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G4-07 — AI Interaction Layer", () => {
  it("resolves cockpit screen context for executive home and engine centers", () => {
    const home = resolveCockpitScreenContext("/cockpit");
    assert.equal(home.screenId, "SCR-001");
    assert.ok(home.availableIntents.includes("explain_panel"));

    const supplier = resolveCockpitScreenContext("/cockpit/intelligence/suppliers");
    assert.equal(supplier.screenTitle, "Supplier Engine");
    assert.ok(supplier.boundModules.includes("cockpit-engine"));
  });

  it("builds five-field AI insight contract from engine panel (no LLM)", () => {
    const panel = loadEnginePanelView("supplier", "ws_g407");
    const insight = buildEngineAiInsight(panel);
    assert.ok(insight.currentInsight);
    assert.ok(insight.recommendedAction);
    assert.ok(["high", "medium", "low", "unavailable"].includes(insight.confidence));
    assert.ok(insight.reasoningSource);
    assert.ok(Array.isArray(insight.supportingEvidence));
    assert.ok(insight.futureCapabilities.length > 0);
  });

  it("loads interaction context with bridge targets", () => {
    const ctx = loadCockpitInteractionContext("ws_g407", "/cockpit");
    assert.ok(ctx.pageInsight);
    assert.ok(ctx.suggestedPrompts.length >= 3);
    assert.ok(ctx.bridgeTargets.some((t) => t.id === "brain"));
    assert.ok(ctx.bridgeTargets.some((t) => t.id === "pillow-supervisor"));
  });

  it("handles explain_panel intent from executive-home aggregate", () => {
    const response = handleCockpitInteraction("ws_g407", {
      intent: "explain_panel",
      screenPath: "/cockpit",
      targetType: "widget",
      targetId: "empire-health",
      label: "Empire Health",
    });
    assert.equal(response.intent, "explain_panel");
    assert.ok(response.summary);
    assert.ok(response.insight.recommendedAction);
    assert.ok(response.suggestedFollowUps.length > 0);
  });

  it("handles recommend_next_action without fabricated metrics", () => {
    const response = handleCockpitInteraction("ws_g407", {
      intent: "recommend_next_action",
      screenPath: "/cockpit",
      targetType: "page",
    });
    assert.equal(response.intent, "recommend_next_action");
    assert.ok(response.insight.reasoningSource.includes("OMS") || response.insight.reasoningSource.includes("executive"));
  });
});
