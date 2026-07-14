import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTHORIZATION_CENTRE_ROUTE,
  AUTHORIZATION_CENTRE_SCREEN_ID,
  authorizationCentrePluginRegistry,
  authorizationCentreTools,
  createAuthorizationCentreModuleContract,
  loadAuthorizationCentreDetailView,
  loadAuthorizationCentreView,
  resetAuthorizationCentreHarnessForTests,
  validateAuthorizationCentreAction,
} from "../../orchestration/identity-authorization-platform/authorization-centre/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const WORKSPACE_ID = "ws_empire_1";

describe("G8-05 — Authorization Centre Cockpit", () => {
  it("exposes authorization centre module contract and route", () => {
    const contract = createAuthorizationCentreModuleContract();
    assert.equal(contract.moduleId, "cockpit-authorization-centre");
    assert.equal(contract.missionId, "G8-05");
    assert.equal(contract.route, AUTHORIZATION_CENTRE_ROUTE);
    assert.equal(contract.screenId, AUTHORIZATION_CENTRE_SCREEN_ID);
  });

  it("loads authorization centre dashboard with executive sections", () => {
    resetAuthorizationCentreHarnessForTests();
    const view = loadAuthorizationCentreView(WORKSPACE_ID);
    assert.equal(view.screenId, "SCR-304");
    assert.equal(view.route, "/cockpit/operations/authorizations");
    assert.equal(view.workspaceId, WORKSPACE_ID);
    assert.ok(view.overview);
    assert.equal(typeof view.overview.overallReadinessPercent, "number");
    assert.ok(Array.isArray(view.providerCards));
    assert.equal(view.providerCards.length, 15);
    assert.ok(Array.isArray(view.providerMatrix));
    assert.equal(view.providerMatrix.length, 15);
    assert.ok(Array.isArray(view.attentionItems));
    assert.ok(Array.isArray(view.accountHolderGroups));
    assert.ok(Array.isArray(view.grandKingConnections));
    assert.ok(Array.isArray(view.recentActivity));
    assert.equal(view.pillowGovernanceState, "pillow-governed");
  });

  it("renders provider cards with full contract fields", () => {
    resetAuthorizationCentreHarnessForTests();
    const view = loadAuthorizationCentreView(WORKSPACE_ID);
    const card = view.providerCards.find((c) => c.providerId === "stripe");
    assert.ok(card);
    assert.equal(card!.providerName, "Stripe");
    assert.ok(card!.providerCategory);
    assert.ok(card!.connectionStatus);
    assert.ok(card!.authorizationStatus);
    assert.ok(card!.credentialStatus);
    assert.ok(card!.healthStatus);
    assert.ok(card!.readinessStatus);
    assert.ok(card!.accountHolderId);
    assert.ok(card!.primaryAction);
  });

  it("loads provider detail view with scopes permissions and EKLS references", () => {
    resetAuthorizationCentreHarnessForTests();
    const detail = loadAuthorizationCentreDetailView(WORKSPACE_ID, "google");
    assert.ok(detail);
    assert.equal(detail!.providerId, "google");
    assert.ok(detail!.connectionSummary);
    assert.ok(Array.isArray(detail!.requiredScopes));
    assert.ok(Array.isArray(detail!.grantedScopes));
    assert.ok(Array.isArray(detail!.missingScopes));
    assert.ok(Array.isArray(detail!.requiredPermissions));
    assert.ok(Array.isArray(detail!.credentialReferences));
    assert.ok(Array.isArray(detail!.healthChecks));
    assert.ok(detail!.readinessResult);
    assert.ok(Array.isArray(detail!.eklsEvents));
    assert.ok(detail!.brainActions.length >= 5);
    assert.equal(detail!.pillowGovernanceState, "pillow-governed");
  });

  it("returns null detail for unknown provider", () => {
    resetAuthorizationCentreHarnessForTests();
    assert.equal(loadAuthorizationCentreDetailView(WORKSPACE_ID, "unknown-provider"), null);
  });

  it("registers authorization centre Brain tools", () => {
    const names = new Set(authorizationCentreTools.map((tool) => tool.name));
    for (const toolName of [
      "authorization_centre.load_view",
      "authorization_centre.load_detail",
      "authorization_centre.attention_items",
      "authorization_centre.execute_action",
    ]) {
      assert.equal(names.has(toolName), true, `Missing tool: ${toolName}`);
    }
  });

  it("Brain load view never exposes secrets", async () => {
    resetAuthorizationCentreHarnessForTests();
    const loadTool = authorizationCentreTools.find((t) => t.name === "authorization_centre.load_view");
    assert.ok(loadTool);
    const result = await loadTool!.handler(
      { workspaceId: WORKSPACE_ID },
      { workspaceId: WORKSPACE_ID, agentId: "test", correlationId: "corr" },
    );
    const serialized = JSON.stringify(result);
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("client_secret"), false);
  });

  it("enforces Pillow governance on executive actions", () => {
    resetAuthorizationCentreHarnessForTests();
    const blocked = validateAuthorizationCentreAction({
      action: "start_authorization",
      actorId: "grand-king",
      workspaceId: WORKSPACE_ID,
      ownerId: "not-owner",
      accountHolderId: "grand-king",
      providerId: "stripe",
    });
    assert.equal(blocked.allowed, false);
  });

  it("supports plugin widgets without modifying cockpit core", () => {
    resetAuthorizationCentreHarnessForTests();
    authorizationCentrePluginRegistry.registerWidget({
      pluginId: "test-health-widget",
      title: "Test Health Widget",
      buildSummary: () => ({ summary: "Plugin health summary" }),
    });
    const view = loadAuthorizationCentreView(WORKSPACE_ID);
    assert.ok(view.pluginWidgets.some((w) => w.pluginId === "test-health-widget"));
  });

  it("displays missing credential and disconnected provider counts", () => {
    resetAuthorizationCentreHarnessForTests();
    const view = loadAuthorizationCentreView(WORKSPACE_ID);
    assert.ok(view.overview.missingCredentials >= 0);
    assert.ok(view.overview.disconnectedProviders >= 0);
    assert.equal(
      view.overview.connectedProviders + view.overview.disconnectedProviders <= view.providerCards.length,
      true,
    );
  });

  it("executes Pillow-governed health check action via Brain tool", async () => {
    resetAuthorizationCentreHarnessForTests();
    const executeTool = authorizationCentreTools.find((t) => t.name === "authorization_centre.execute_action");
    assert.ok(executeTool);
    const result = (await executeTool!.handler(
      {
        workspaceId: WORKSPACE_ID,
        actorId: "grand-king",
        ownerId: "grand-king",
        accountHolderId: "grand-king",
        providerId: "openai",
        action: "run_health_check",
      },
      { workspaceId: WORKSPACE_ID, agentId: "test", correlationId: "corr" },
    )) as { success: boolean; pillowGoverned?: boolean };
    assert.equal(result.success, true);
    assert.equal(result.pillowGoverned, true);
  });
});
