import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { Orchestrator } from "../../brain/orchestrator.js";
import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import {
  assessGovernanceDispatch,
  evaluateGovernanceDecision,
  getGovernanceEngine,
  GovernanceBlockedError,
  initializeGovernancePolicies,
  isGovernanceEnvEnabled,
  resetGovernanceEngine,
  resetGovernanceRepository,
  governanceTools,
} from "../../foundation/empire-governance/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-s003";
const ORIGINAL_ENV = { ...process.env };

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "empire-governance",
    correlationId: "corr-s003",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = governanceTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.META_ADS_LAUNCH_ENABLED;
  delete process.env.PRODUCTION_DEPLOYMENT_ENABLED;
  delete process.env.LIVE_PAYMENT_ENABLED;
  delete process.env.LIVE_CJ_FULFILLMENT_ENABLED;
  configureValidationEnvironment();
  resetGovernanceRepository();
  resetGovernanceEngine();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  resetGovernanceEngine();
  resetGovernanceRepository();
  resetDatabaseInstance();
});

describe("S003 Empire Governance Engine", () => {
  it("registers seven governance Brain tools", () => {
    assert.equal(governanceTools.length, 7);
    assert.ok(governanceTools.some((tool) => tool.name === "governance.evaluate"));
  });

  it("seeds default policies across all governance domains", () => {
    const policies = initializeGovernancePolicies(WORKSPACE_ID);
    assert.ok(policies.length >= 10);

    const domains = new Set(policies.map((policy) => policy.domain));
    assert.ok(domains.has("founder"));
    assert.ok(domains.has("deployment"));
    assert.ok(domains.has("marketing"));
    assert.ok(domains.has("supplier"));
    assert.ok(domains.has("capital"));
    assert.ok(domains.has("grandKings"));
    assert.ok(domains.has("policies"));
  });

  it("blocks meta ads launch when env gate disabled via governance", () => {
    initializeGovernancePolicies(WORKSPACE_ID);

    const verdict = evaluateGovernanceDecision({
      workspaceId: WORKSPACE_ID,
      domain: "marketing",
      module: "meta-ads-connector",
      action: "launch_campaign",
      payload: {},
    });

    assert.equal(verdict.allowed, false);
    assert.ok(
      verdict.reason.includes("META_ADS_LAUNCH_ENABLED") || verdict.requiresApproval === true,
    );
  });

  it("requires founder approval for launch when env enabled", () => {
    process.env.META_ADS_LAUNCH_ENABLED = "true";
    initializeGovernancePolicies(WORKSPACE_ID);

    const verdict = evaluateGovernanceDecision({
      workspaceId: WORKSPACE_ID,
      domain: "marketing",
      module: "meta-ads-connector",
      action: "launch_campaign",
      payload: {},
    });

    assert.equal(verdict.allowed, false);
    assert.equal(verdict.requiresApproval, true);
    assert.equal(verdict.approvalType, "founder");
  });

  it("allows launch when governance env and founder approval satisfied", () => {
    process.env.META_ADS_LAUNCH_ENABLED = "true";
    initializeGovernancePolicies(WORKSPACE_ID);

    const verdict = evaluateGovernanceDecision({
      workspaceId: WORKSPACE_ID,
      domain: "marketing",
      module: "meta-ads-connector",
      action: "launch_campaign",
      founderApproved: true,
      actorRole: "founder",
      payload: { founderApproved: true },
    });

    assert.equal(verdict.allowed, true);
  });

  it("blocks orchestrator dispatch through governance before execution", async () => {
    initializeGovernancePolicies(WORKSPACE_ID);
    const engine = getGovernanceEngine();

    const orchestrator = new Orchestrator({
      agentManager: {} as never,
      workflowEngine: {} as never,
      taskQueue: {} as never,
      eventBus: { publish: async () => ({}) } as never,
      auditLogger: { write: () => ({}) } as never,
      toolRegistry: { get: () => undefined, require: () => ({ handler: async () => ({}) }) } as never,
      governance: engine,
      routes: [
        {
          module: "meta-ads-connector",
          action: "launch_campaign",
          toolName: "meta_ads.launch_campaign",
        },
      ],
    });

    await assert.rejects(
      () =>
        orchestrator.dispatch({
          module: "meta-ads-connector",
          action: "launch_campaign",
          workspaceId: WORKSPACE_ID,
          payload: {},
        }),
      GovernanceBlockedError,
    );
  });

  it("records governance decisions in audit trail", () => {
    initializeGovernancePolicies(WORKSPACE_ID);
    const engine = getGovernanceEngine();

    engine.evaluateDecision({
      workspaceId: WORKSPACE_ID,
      domain: "grandKings",
      module: "grand-kings-revenue-engine",
      action: "run_cycle",
      payload: {},
    });

    const decisions = engine.listDecisions(WORKSPACE_ID);
    assert.ok(decisions.length >= 1);
    assert.equal(decisions[0]?.module, "grand-kings-revenue-engine");
  });

  it("exposes capability matrix via governance env bridge", async () => {
    initializeGovernancePolicies(WORKSPACE_ID);

    assert.equal(isGovernanceEnvEnabled("META_ADS_LAUNCH"), false);

    const result = (await invokeTool("governance.get_capabilities")) as {
      deployment: Array<{ allowed: boolean }>;
    };
    assert.ok(Array.isArray(result.deployment));
  });

  it("assesses dispatch via Brain tool", async () => {
    initializeGovernancePolicies(WORKSPACE_ID);

    const verdict = (await invokeTool("governance.assess_dispatch", {
      module: "first-revenue-validation",
      action: "run",
    })) as { allowed: boolean; sandboxOnly?: boolean };

    assert.equal(verdict.allowed, true);
    assert.equal(verdict.sandboxOnly, true);
  });

  it("rejects decisions without workspace identity", () => {
    initializeGovernancePolicies(WORKSPACE_ID);

    const verdict = assessGovernanceDispatch({
      module: "dashboard",
      action: "load",
      workspaceId: "",
      payload: {},
    });

    assert.equal(verdict.allowed, false);
    assert.equal(verdict.code, "IDENTITY_WORKSPACE_REQUIRED");
  });
});
