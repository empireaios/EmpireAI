import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  buildGlobalAssistantDashboard,
  buildWhyResponse,
  createAssistantSession,
  decideAssistantCommand,
  generateExecutiveAuditArtifact,
  getAssistantHistory,
  registerAssistantCommand,
  requestMissionGenerationCommand,
  resetGlobalAssistantRepository,
  resolveScreenContext,
  sendAssistantMessage,
} from "../../global-assistant/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-gc-05";
const COMPANY_ID = "grand-king-company";

describe("GC-05 — Global AI Assistant", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGlobalAssistantRepository();
  });

  afterEach(() => {
    resetGlobalAssistantRepository();
    resetDatabaseInstance();
  });

  it("GC-05 — dashboard reports GC-05 mission ownership", () => {
    const dashboard = buildGlobalAssistantDashboard(WORKSPACE_ID, COMPANY_ID);
    assert.equal(dashboard.missionId, "GC-05");
    assert.equal(dashboard.recommendOnly, true);
    assert.ok(dashboard.features.includes("journey_awareness"));
  });

  it("GC-05 — screen context resolves Mission Home", () => {
    const screen = resolveScreenContext("/dashboard");
    assert.equal(screen.screenId, "mission-home");
    assert.equal(screen.uxId, "UX-002");
  });

  it("GC-05 — Why? returns live evidence without hardcoded KPI text", () => {
    const why = buildWhyResponse(WORKSPACE_ID, COMPANY_ID, "/dashboard", "Empire Health", "72%");
    assert.ok(why.headline.includes("Empire Health"));
    assert.equal(why.recommendOnly, true);
    assert.ok(Array.isArray(why.evidence));
  });

  it("GC-05 — conversation history persists across messages", () => {
    const session = createAssistantSession(WORKSPACE_ID, COMPANY_ID, "/dashboard");
    sendAssistantMessage({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      sessionId: session.sessionId,
      message: "What are the chief recommendations?",
      screenPath: "/dashboard",
    });
    const history = getAssistantHistory(session.sessionId);
    assert.ok(history.length >= 3);
    assert.equal(history[0]?.role, "assistant");
    assert.equal(history[1]?.role, "user");
    assert.equal(history[2]?.role, "assistant");
  });

  it("GC-05 — mission generation command requires approval gate", () => {
    const session = createAssistantSession(WORKSPACE_ID, COMPANY_ID, "/dashboard/ai-team");
    const command = requestMissionGenerationCommand(WORKSPACE_ID, COMPANY_ID, session.sessionId);
    assert.equal(command.status, "pending");
    assert.equal(command.requiresApproval, true);

    const approved = decideAssistantCommand(WORKSPACE_ID, command.commandId, "approved");
    assert.equal(approved?.status, "executed");
    assert.ok(approved?.result);
  });

  it("GC-05 — executive audit generation produces artifact", () => {
    const session = createAssistantSession(WORKSPACE_ID, COMPANY_ID, "/dashboard/command");
    const command = registerAssistantCommand({
      workspaceId: WORKSPACE_ID,
      companyId: COMPANY_ID,
      sessionId: session.sessionId,
      type: "executive_audit_generation",
      title: "Audit test",
      summary: "Generate audit",
      screenPath: "/dashboard/command",
    });
    const approved = decideAssistantCommand(
      WORKSPACE_ID,
      command.commandId,
      "approved",
      "/dashboard/command",
    );
    assert.equal(approved?.status, "executed");
    const artifact = approved?.result as { artifactId?: string; content?: string };
    assert.ok(artifact?.content?.includes("Executive Audit"));
  });

  it("GC-05 — AI Team screen binds REAL-031/032/033 APIs", () => {
    const screen = resolveScreenContext("/dashboard/ai-team");
    assert.ok(screen.boundApis?.some((api) => api.includes("ai-chief-of-commerce")));
    assert.ok((screen.journeyMarkers ?? []).includes("REAL-031"));
  });
});
