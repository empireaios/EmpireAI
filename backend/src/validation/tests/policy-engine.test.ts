import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import {
  CANONICAL_POLICY_IDS,
  disablePolicy,
  enablePolicy,
  getExecutableBusinessPolicies,
  initializePolicies,
  listPolicyLifecycle,
  policyTools,
  resetPolicyRepository,
  resolvePolicy,
  setProductSelectionMode,
  updatePolicy,
} from "../../foundation/policy-engine/index.js";
import {
  evaluateGovernanceDecision,
  initializeGovernancePolicies,
  resetGovernanceEngine,
  resetGovernanceRepository,
} from "../../foundation/empire-governance/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-s006";
const ORIGINAL_ENV = { ...process.env };

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "policy-engine",
    correlationId: "corr-s006",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = policyTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.META_ADS_LAUNCH_ENABLED;
  configureValidationEnvironment();
  resetPolicyRepository();
  resetGovernanceRepository();
  resetGovernanceEngine();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  resetPolicyRepository();
  resetGovernanceEngine();
  resetGovernanceRepository();
  resetDatabaseInstance();
});

describe("S006 Policy Engine", () => {
  it("registers twelve policy Brain tools", () => {
    assert.equal(policyTools.length, 12);
    assert.ok(policyTools.some((tool) => tool.name === "policy.resolve"));
    assert.ok(policyTools.some((tool) => tool.name === "policy.set_product_selection_mode"));
  });

  it("seeds six default business policies covering all example categories", () => {
    const policies = initializePolicies(WORKSPACE_ID);

    assert.equal(policies.length, 6);
    assert.ok(policies.some((p) => p.policyId === CANONICAL_POLICY_IDS.PRODUCT_SELECTION));
    assert.ok(policies.some((p) => p.policyId === CANONICAL_POLICY_IDS.AD_APPROVAL));
    assert.ok(policies.some((p) => p.policyId === CANONICAL_POLICY_IDS.CAPITAL_APPROVAL));
    assert.ok(policies.some((p) => p.policyId === CANONICAL_POLICY_IDS.PRICING_RULES));
    assert.ok(policies.some((p) => p.policyId === CANONICAL_POLICY_IDS.FOUNDER_AI_USAGE));
    assert.ok(policies.some((p) => p.policyId === CANONICAL_POLICY_IDS.GRAND_KINGS_PRIVILEGES));
  });

  it("resolves manual product selection without hardcoded module logic", () => {
    initializePolicies(WORKSPACE_ID);

    const resolution = resolvePolicy({
      workspaceId: WORKSPACE_ID,
      category: "productSelection",
      module: "product-scout",
      action: "select",
      context: { score: 0.95 },
    });

    assert.equal(resolution.decisionMode, "manual");
    assert.equal(resolution.automatic, false);
    assert.equal(resolution.requiresApproval, false);
    assert.ok(resolution.reason.includes("manual"));
  });

  it("switches product selection to automatic via configurable policy", () => {
    initializePolicies(WORKSPACE_ID);

    const updated = setProductSelectionMode(WORKSPACE_ID, "automatic", "founder@test.com");
    assert.equal(updated.decisionMode, "automatic");
    assert.equal(updated.config.mode, "automatic");

    const resolution = resolvePolicy({
      workspaceId: WORKSPACE_ID,
      category: "productSelection",
      context: { score: 0.92 },
    });

    assert.equal(resolution.automatic, true);
    assert.equal(resolution.requiresApproval, false);
  });

  it("resolves capital approval with threshold context", () => {
    initializePolicies(WORKSPACE_ID);

    const aboveThreshold = resolvePolicy({
      workspaceId: WORKSPACE_ID,
      category: "capitalApproval",
      context: { amountCents: 600_000_00 },
    });
    assert.equal(aboveThreshold.requiresApproval, true);

    const belowThreshold = resolvePolicy({
      workspaceId: WORKSPACE_ID,
      category: "capitalApproval",
      context: { amountCents: 100_000_00 },
    });
    assert.equal(belowThreshold.requiresApproval, false);
  });

  it("resolves Grand King's privileges from config", () => {
    initializePolicies(WORKSPACE_ID);

    const resolution = resolvePolicy({
      workspaceId: WORKSPACE_ID,
      category: "grandKingsPrivileges",
    });

    assert.equal(resolution.allowed, true);
    assert.equal(resolution.config.canApproveCapital, true);
    assert.equal(resolution.config.canLaunchAds, true);
    assert.equal(resolution.config.canModifyPolicies, true);
  });

  it("tracks CREATED, MODIFIED, DISABLED, ENABLED, and RESOLVED lifecycle", () => {
    initializePolicies(WORKSPACE_ID);

    assert.ok(
      listPolicyLifecycle(CANONICAL_POLICY_IDS.PRICING_RULES).some((e) => e.event === "CREATED"),
    );

    updatePolicy({
      policyId: CANONICAL_POLICY_IDS.PRICING_RULES,
      config: { strategy: "rule-based", minimumMarginPercent: 40 },
      actor: "founder@test.com",
    });
    assert.ok(
      listPolicyLifecycle(CANONICAL_POLICY_IDS.PRICING_RULES).some((e) => e.event === "MODIFIED"),
    );

    disablePolicy(CANONICAL_POLICY_IDS.FOUNDER_AI_USAGE, "founder@test.com");
    assert.ok(
      listPolicyLifecycle(CANONICAL_POLICY_IDS.FOUNDER_AI_USAGE).some((e) => e.event === "DISABLED"),
    );

    enablePolicy(CANONICAL_POLICY_IDS.FOUNDER_AI_USAGE, "founder@test.com");
    assert.ok(
      listPolicyLifecycle(CANONICAL_POLICY_IDS.FOUNDER_AI_USAGE).some((e) => e.event === "ENABLED"),
    );

    resolvePolicy({ workspaceId: WORKSPACE_ID, category: "founderAi" });
    assert.ok(
      listPolicyLifecycle(CANONICAL_POLICY_IDS.FOUNDER_AI_USAGE).some((e) => e.event === "RESOLVED"),
    );
  });

  it("compiles active policies into governance enforcement rules", () => {
    initializePolicies(WORKSPACE_ID);

    const rules = getExecutableBusinessPolicies(WORKSPACE_ID);
    assert.ok(rules.length >= 3);
    assert.ok(
      rules.some(
        (rule) =>
          rule.policyId.startsWith(`governance:${CANONICAL_POLICY_IDS.AD_APPROVAL}:`) &&
          rule.metadata.source === "policy-engine",
      ),
    );
  });

  it("enforces business policy rules through governance evaluation", () => {
    initializePolicies(WORKSPACE_ID);
    initializeGovernancePolicies(WORKSPACE_ID);

    const verdict = evaluateGovernanceDecision({
      workspaceId: WORKSPACE_ID,
      domain: "capital",
      module: "live-payments",
      action: "create_checkout",
      payload: {},
    });

    assert.equal(verdict.allowed, false);
    assert.equal(verdict.requiresApproval, true);
    assert.ok(verdict.policyId?.startsWith(`governance:${CANONICAL_POLICY_IDS.CAPITAL_APPROVAL}:`));
  });

  it("exposes policy operations via Brain tools", async () => {
    const listed = (await invokeTool("policy.list")) as { policies: unknown[] };
    assert.ok(Array.isArray(listed.policies));
    assert.ok(listed.policies.length >= 6);

    const resolution = await invokeTool("policy.resolve", { category: "pricing" });
    assert.ok(resolution && typeof resolution === "object" && "decisionMode" in resolution);
  });
});
