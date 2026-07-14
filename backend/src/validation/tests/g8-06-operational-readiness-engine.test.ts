import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertNoSecretsInReadinessPayload,
  buildCockpitReadinessSummary,
  createCredentialReference,
  createOperationalReadinessModuleContract,
  evaluateReadinessForAutomation,
  evaluateReadinessForProvider,
  evaluateReadinessForWorkflow,
  evaluateReadinessOverview,
  getReadinessBlockers,
  getReadinessRecommendations,
  listReadinessEklsKinds,
  listReadinessPlugins,
  OPERATIONAL_READINESS_ENGINE_VERSION,
  operationalReadinessTools,
  READINESS_CONTEXTS,
  READINESS_EKLS_KINDS,
  READINESS_LEVELS,
  redactReadinessSecrets,
  registerReadinessPlugin,
  resetOperationalReadinessHarnessForTests,
  resolveReadinessPolicyProfile,
  resolveRequiredProvidersForContext,
  resolveWorkflowIds,
  searchReadinessEklsObservations,
  startAuthorization,
  submitAuthorizationCredentials,
  validateAuthorizationResult,
  validateReadinessPillowGovernance,
} from "../../orchestration/identity-authorization-platform/index.js";
import { resetConnectionRegistryHarnessForTests } from "../../orchestration/identity-authorization-platform/connection-registry/index.js";
import { resetAuthorizationFrameworkHarnessForTests } from "../../orchestration/identity-authorization-platform/authorization-framework/index.js";
import { resetCredentialVaultHarnessForTests } from "../../orchestration/identity-authorization-platform/credential-vault-integration/index.js";
import { resetConnectionHealthHarnessForTests } from "../../orchestration/identity-authorization-platform/connection-health-monitoring/index.js";
import { loadAuthorizationCentreView } from "../../orchestration/identity-authorization-platform/authorization-centre/index.js";
import type { ToolContext } from "../../brain/types.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const CANONICAL_WORKSPACE_ID = "ws_empire_1";

const TEST_ACTOR = {
  actorId: "grand-king",
  ownerId: "grand-king",
  accountHolderId: "grand-king",
  workspaceId: CANONICAL_WORKSPACE_ID,
  pillowGovernance: true as const,
};

function toolContext(): ToolContext {
  return {
    agentId: "test-agent",
    correlationId: "test-correlation",
    workspaceId: CANONICAL_WORKSPACE_ID,
  };
}

function seedReadinessHarness() {
  resetConnectionRegistryHarnessForTests();
  resetAuthorizationFrameworkHarnessForTests();
  resetCredentialVaultHarnessForTests();
  resetConnectionHealthHarnessForTests();
  resetOperationalReadinessHarnessForTests();
}

function connectProvider(providerId: string) {
  const started = startAuthorization({ ...TEST_ACTOR, providerId });
  submitAuthorizationCredentials({
    ...TEST_ACTOR,
    authorizationId: started.request.authorizationId,
    credentialKind: "api_key",
  });
  validateAuthorizationResult({
    ...TEST_ACTOR,
    authorizationId: started.request.authorizationId,
  });
  createCredentialReference({
    ...TEST_ACTOR,
    providerId,
    authorizationId: started.request.authorizationId,
    connectionId: started.request.connectionId,
  });
}

describe("G8-06 — Operational Readiness Engine", () => {
  it("exposes operational readiness engine version and types", () => {
    assert.equal(OPERATIONAL_READINESS_ENGINE_VERSION, "g8-06-v1");
    assert.equal(READINESS_LEVELS.length, 6);
    assert.equal(READINESS_CONTEXTS.length, 16);
    assert.equal(READINESS_EKLS_KINDS.length, 6);
  });

  it("registers operational readiness Brain module contract", () => {
    const contract = createOperationalReadinessModuleContract();
    assert.equal(contract.moduleId, "operational-readiness-engine");
    assert.equal(contract.missionId, "G8-06");
    assert.equal(contract.programmeStatus, "operational-readiness-engine-established");
    assert.ok(contract.registryRefs.includes("REG-READINESS-POLICY"));
    assert.ok(contract.registryRefs.includes("REG-AUTOMATION-WORKFLOW"));
    assert.equal(contract.brainTools.length, 8);
  });

  it("resolves readiness policy profile from registries", () => {
    seedReadinessHarness();
    const profile = resolveReadinessPolicyProfile({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(profile.policyIds.length >= 1);
    assert.ok(profile.registryRefs.includes("REG-CONNECTION-PROVIDER"));
    assert.ok(profile.requiredProviderIds.length >= 14);
  });

  it("resolves required providers by operation context from registry categories", () => {
    seedReadinessHarness();
    const marketplace = resolveRequiredProvidersForContext("marketplace_operation", {
      workspaceId: CANONICAL_WORKSPACE_ID,
    });
    const payment = resolveRequiredProvidersForContext("payment_operation", {
      workspaceId: CANONICAL_WORKSPACE_ID,
    });
    assert.ok(marketplace.includes("amazon"));
    assert.ok(payment.includes("stripe"));
    assert.equal(marketplace.includes("stripe"), false);
  });

  it("evaluates workspace readiness with full result contract", () => {
    seedReadinessHarness();
    const evaluation = evaluateReadinessOverview({ ...TEST_ACTOR });
    const result = evaluation.result;
    assert.equal(result.workspaceId, CANONICAL_WORKSPACE_ID);
    assert.equal(typeof result.readinessScore, "number");
    assert.ok(READINESS_LEVELS.includes(result.readinessLevel));
    assert.ok(Array.isArray(result.requiredProviders));
    assert.ok(result.requiredProviders.length >= 14);
    assert.ok(Array.isArray(result.blockingIssues));
    assert.ok(Array.isArray(result.recommendedActions));
    assert.ok(Array.isArray(result.evidence));
    assert.ok(result.correlationId);
    assert.ok(result.lastEvaluatedAt);
    assert.equal(result.governanceState, "pillow-governed");
  });

  it("evaluates provider readiness for commerce providers", () => {
    seedReadinessHarness();
    connectProvider("stripe");
    const stripe = evaluateReadinessForProvider({ ...TEST_ACTOR, providerId: "stripe" });
    assert.equal(stripe.result.providerId, "stripe");
    assert.ok(stripe.result.connectedProviders.includes("stripe"));
    assert.equal(stripe.result.readinessLevel, "ready");

    const amazon = evaluateReadinessForProvider({ ...TEST_ACTOR, providerId: "amazon" });
    assert.equal(amazon.result.missingProviders.includes("amazon"), true);
    assert.ok(amazon.result.missingCredentials.includes("amazon"));
  });

  it("detects missing provider and permission requirements", () => {
    seedReadinessHarness();
    startAuthorization({ ...TEST_ACTOR, providerId: "shopify" });
    const shopify = evaluateReadinessForProvider({ ...TEST_ACTOR, providerId: "shopify" });
    assert.equal(shopify.result.connectedProviders.length, 0);
    assert.ok(shopify.result.missingProviders.includes("shopify"));
    assert.ok(shopify.result.recommendedActions.some((r) => r.action === "submit_credentials"));
  });

  it("evaluates workflow and automation readiness for business automation", () => {
    seedReadinessHarness();
    const workflowIds = resolveWorkflowIds({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(workflowIds.length >= 1);
    const workflow = evaluateReadinessForWorkflow({
      ...TEST_ACTOR,
      workflowId: workflowIds[0]!,
    });
    assert.equal(typeof workflow.canExecute, "boolean");
    assert.ok(workflow.nextAction);
    assert.ok(workflow.result.context === "workflow");

    const automation = evaluateReadinessForAutomation({
      ...TEST_ACTOR,
      automationId: "automation-foundation-dispatch",
    });
    assert.equal(typeof automation.canExecute, "boolean");
    assert.ok(automation.result.context === "automation");
  });

  it("computes readiness scoring with blockers", () => {
    seedReadinessHarness();
    connectProvider("meta");
    const blockers = getReadinessBlockers({ ...TEST_ACTOR });
    assert.ok(Array.isArray(blockers.blockers));
    assert.ok(blockers.missingProviders.length >= 1);
    assert.ok(blockers.blockers.some((b) => b.blockerId.includes("missing-provider")));
  });

  it("detects expired connection blocker via health state", () => {
    seedReadinessHarness();
    connectProvider("google");
    const evaluation = evaluateReadinessForProvider({ ...TEST_ACTOR, providerId: "google" });
    assert.ok(Array.isArray(evaluation.result.expiredProviders));
    assert.ok(Array.isArray(evaluation.result.blockingIssues));
  });

  it("generates readiness recommendations", () => {
    seedReadinessHarness();
    const recommendations = getReadinessRecommendations({ ...TEST_ACTOR });
    assert.ok(Array.isArray(recommendations.recommendations));
    assert.ok(recommendations.nextRequiredAction);
    assert.ok(recommendations.correlationId);
  });

  it("registers all required readiness Brain tools", () => {
    const names = new Set(operationalReadinessTools.map((tool) => tool.name));
    for (const toolName of [
      "readiness_overview",
      "readiness_for_workspace",
      "readiness_for_account_holder",
      "readiness_for_provider",
      "readiness_for_workflow",
      "readiness_for_automation",
      "readiness_blockers",
      "readiness_recommendations",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("Brain tools never expose raw secrets", async () => {
    seedReadinessHarness();
    connectProvider("anthropic");
    const tool = operationalReadinessTools.find((t) => t.name === "readiness_for_provider");
    assert.ok(tool);
    const result = await tool!.handler({ providerId: "anthropic", ...TEST_ACTOR }, toolContext());
    assert.equal(assertNoSecretsInReadinessPayload(result), true);
    assert.equal(JSON.stringify(result).includes("sk_live"), false);
    assert.equal(JSON.stringify(result).includes("client_secret"), false);
  });

  it("passes Pillow governance for readiness evaluation", () => {
    seedReadinessHarness();
    const result = validateReadinessPillowGovernance({
      ...TEST_ACTOR,
      operation: "evaluate",
      providerId: "vercel",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.evaluationAuthority, true);
    assert.equal(result.workspaceIsolation, true);
  });

  it("rejects Pillow governance bypass", () => {
    seedReadinessHarness();
    const result = validateReadinessPillowGovernance({
      actorId: "grand-king",
      workspaceId: CANONICAL_WORKSPACE_ID,
      ownerId: "grand-king",
      operation: "evaluate",
      pillowGovernance: false as unknown as true,
    });
    assert.equal(result.allowed, false);
  });

  it("records EKLS readiness events", () => {
    seedReadinessHarness();
    assert.deepEqual(listReadinessEklsKinds(), [...READINESS_EKLS_KINDS]);
    evaluateReadinessOverview({ ...TEST_ACTOR });
    const observations = searchReadinessEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      pillowGovernance: true,
    });
    assert.ok(observations.some((o) => o.kind === "readiness_evaluated"));
    assert.ok(observations.some((o) => o.kind === "readiness_requirement_missing"));
  });

  it("redacts secrets from readiness payloads", () => {
    const redacted = redactReadinessSecrets({ api_key: "sk_live_secret", providerId: "stripe" }) as Record<
      string,
      unknown
    >;
    assert.equal(redacted.api_key, "[REDACTED]");
    assert.equal(redacted.providerId, "stripe");
  });

  it("supports plugin registration without modifying readiness core", () => {
    seedReadinessHarness();
    const registered = registerReadinessPlugin({
      ...TEST_ACTOR,
      manifest: {
        pluginId: "test-readiness-rule",
        pluginName: "Test Readiness Rule",
        pluginKind: "readiness_rule",
        pillowGovernance: true,
      },
    });
    assert.equal(registered.accepted, true);
    assert.ok(listReadinessPlugins().some((p) => p.pluginId === "test-readiness-rule"));
  });

  it("exposes cockpit readiness summary for Authorization Centre", () => {
    seedReadinessHarness();
    const summary = buildCockpitReadinessSummary(CANONICAL_WORKSPACE_ID);
    assert.equal(typeof summary.overallReadinessScore, "number");
    assert.ok(summary.overallReadinessLevel);
    assert.ok(Array.isArray(summary.providerReadiness));
    assert.equal(summary.providerReadiness.length, 15);
    assert.equal(summary.pillowGovernanceState, "pillow-governed");

    const view = loadAuthorizationCentreView(CANONICAL_WORKSPACE_ID);
    assert.ok(view.readinessSummary);
    assert.equal(typeof view.readinessSummary!.overallReadinessScore, "number");
    assert.ok(view.readinessSummary!.nextRequiredAction);
  });
});
