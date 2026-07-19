import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyExecutiveQuery,
  mapExecutiveQueryToCockpitIntent,
  shouldRunConversationalPipeline,
  isExecutiveFollowUpQuery,
  isAmbiguousExecutiveRequest,
} from "../../domain/services/executive-conversational-routing.js";
import { handleGlobalAssistantRequest } from "../../domain/services/cockpit-global-assistant.js";
import { handleCockpitInteraction } from "../../domain/services/cockpit-interaction-layer.js";

describe("Executive conversational routing", () => {
  it("classifies screen-awareness queries", () => {
    assert.equal(classifyExecutiveQuery("What am I looking at?"), "screen");
    assert.equal(classifyExecutiveQuery("Can you see my screen?"), "screen");
    assert.equal(mapExecutiveQueryToCockpitIntent("What is this page?"), "explain_screen");
  });

  it("classifies Cursor assistance queries", () => {
    assert.equal(classifyExecutiveQuery("Can you help me with Cursor?"), "cursor");
    assert.equal(mapExecutiveQueryToCockpitIntent("Explain Cursor build failures"), "explain_cursor");
  });

  it("classifies blocker queries separately from screen queries", () => {
    assert.equal(classifyExecutiveQuery("What is the biggest blocker?"), "blocker");
    assert.equal(classifyExecutiveQuery("What should I do next?"), "blocker");
    assert.equal(shouldRunConversationalPipeline("What am I looking at?"), true);
  });

  it("routes memory and follow-up queries through conversational pipeline", () => {
    assert.equal(
      shouldRunConversationalPipeline("Remember this codeword: purple-rabbit-42"),
      true,
    );
    assert.equal(shouldRunConversationalPipeline("What codeword did I give you?"), true);
    assert.equal(isExecutiveFollowUpQuery("Tell me more."), true);
    assert.equal(isExecutiveFollowUpQuery("Why?"), true);
    assert.equal(isAmbiguousExecutiveRequest("Fix it."), true);
    assert.equal(shouldRunConversationalPipeline("Fix it."), true);
  });

  it("returns screen-aware Brain fallback instead of executive blocker echo", () => {
    const response = handleCockpitInteraction("ws_route", {
      intent: "explain_screen",
      screenPath: "/cockpit",
    });
    assert.match(response.summary, /Executive Home/i);
    assert.doesNotMatch(response.summary, /B6-01a — Inject shared LWA/i);
  });

  it("returns Cursor guidance for Cursor help queries via global assistant", () => {
    const response = handleGlobalAssistantRequest("ws_route", {
      action: "ask",
      screenPath: "/cockpit",
      query: "Can you help me with Cursor?",
    });
    assert.equal(response.interactionIntent, "explain_cursor");
    assert.match(response.interactionSummary, /Cursor/i);
    assert.doesNotMatch(response.interactionSummary, /B6-01a — Inject shared LWA/i);
  });
});
