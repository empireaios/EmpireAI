import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  handleGlobalAssistantRequest,
  loadGlobalAssistantContext,
  resolveEngineCenterFromPath,
} from "../../domain/services/cockpit-global-assistant.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G4-09 — Global AI Assistant", () => {
  it("loads context with auto page, engine, mission, and alert awareness", () => {
    const ctx = loadGlobalAssistantContext("ws_g409", "/cockpit/intelligence/suppliers");
    assert.equal(ctx.schemaVersion, "g4-09-v1");
    assert.equal(ctx.executiveContext.engineCenterId, "supplier");
    assert.equal(ctx.executiveContext.screenTitle, "Supplier Engine");
    assert.ok(ctx.executiveContext.contextSummary.includes("Supplier Engine"));
    assert.ok(ctx.availableActions.includes("summarise"));
    assert.ok(ctx.availableActions.includes("next_action"));
    assert.ok(ctx.futureChannels.length >= 4);
  });

  it("returns five-field response contract via G4-07 delegation", () => {
    const response = handleGlobalAssistantRequest("ws_g409", {
      action: "recommend",
      screenPath: "/cockpit",
    });
    assert.ok(response.currentContext);
    assert.ok(response.reason);
    assert.ok(Array.isArray(response.supportingEvidence));
    assert.ok(response.recommendedNextAction);
    assert.ok(response.interactionIntent);
    assert.equal(response.action, "recommend");
  });

  it("summarises executive context without LLM", () => {
    const response = handleGlobalAssistantRequest("ws_g409", {
      action: "summarise",
      screenPath: "/cockpit/missions",
    });
    assert.equal(response.action, "summarise");
    assert.ok(response.interactionSummary.includes("Mission Centre"));
    assert.ok(response.currentContext);
    assert.ok(response.recommendedNextAction);
  });

  it("maps ask queries to interaction intents", () => {
    const alertResponse = handleGlobalAssistantRequest("ws_g409", {
      action: "ask",
      screenPath: "/cockpit",
      query: "Why is this alert shown?",
    });
    assert.equal(alertResponse.interactionIntent, "explain_alert");

    const nextResponse = handleGlobalAssistantRequest("ws_g409", {
      action: "next_action",
      screenPath: "/cockpit/command",
    });
    assert.equal(nextResponse.interactionIntent, "recommend_next_action");
  });

  it("resolves engine center from cockpit path", () => {
    assert.equal(
      resolveEngineCenterFromPath("/cockpit/finance/profit"),
      "analytics",
    );
    assert.equal(resolveEngineCenterFromPath("/cockpit/command"), null);
  });
});
