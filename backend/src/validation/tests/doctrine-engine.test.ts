import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import type { ToolContext } from "../../brain/types.js";
import {
  CANONICAL_DOCTRINE_IDS,
  deprecateDoctrine,
  doctrineTools,
  getExecutableDoctrinePolicies,
  initializeDoctrines,
  listDoctrineLifecycle,
  modifyDoctrine,
  publishDoctrine,
  recordDoctrineReference,
  resetDoctrineRepository,
  supersedeDoctrine,
} from "../../foundation/doctrine-engine/index.js";
import {
  initializeGovernancePolicies,
  resetGovernanceEngine,
  resetGovernanceRepository,
  evaluateGovernanceDecision,
} from "../../foundation/empire-governance/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-s005";
const ORIGINAL_ENV = { ...process.env };

function toolContext(): ToolContext {
  return {
    workspaceId: WORKSPACE_ID,
    agentId: "doctrine-engine",
    correlationId: "corr-s005",
  };
}

async function invokeTool(name: string, args: Record<string, unknown> = {}) {
  const tool = doctrineTools.find((entry) => entry.name === name);
  assert.ok(tool, `tool ${name} should be registered`);
  return tool.handler({ workspaceId: WORKSPACE_ID, ...args }, toolContext());
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.META_ADS_LAUNCH_ENABLED;
  configureValidationEnvironment();
  resetDoctrineRepository();
  resetGovernanceRepository();
  resetGovernanceEngine();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  resetDoctrineRepository();
  resetGovernanceEngine();
  resetGovernanceRepository();
  resetDatabaseInstance();
});

describe("S005 Doctrine Engine", () => {
  it("registers eleven doctrine Brain tools", () => {
    assert.equal(doctrineTools.length, 11);
    assert.ok(doctrineTools.some((tool) => tool.name === "doctrine.list"));
    assert.ok(doctrineTools.some((tool) => tool.name === "doctrine.list_executable_policies"));
  });

  it("seeds seven default Empire doctrines with canonical IDs", () => {
    const doctrines = initializeDoctrines(WORKSPACE_ID);

    assert.equal(doctrines.length, 7);
    assert.ok(doctrines.some((d) => d.doctrineId === CANONICAL_DOCTRINE_IDS.PROTECT_THE_EMPIRE));
    assert.ok(doctrines.some((d) => d.doctrineId === CANONICAL_DOCTRINE_IDS.NO_LIVE_WITHOUT_GATES));
    assert.ok(doctrines.some((d) => d.doctrineId === CANONICAL_DOCTRINE_IDS.FOUNDER_SOVEREIGNTY));
    assert.ok(doctrines.some((d) => d.doctrineId === CANONICAL_DOCTRINE_IDS.SANDBOX_FIRST));
    assert.ok(doctrines.some((d) => d.doctrineId === CANONICAL_DOCTRINE_IDS.REVENUE_TRUTH));
    assert.ok(doctrines.some((d) => d.doctrineId === CANONICAL_DOCTRINE_IDS.LIVING_SOUL));
    assert.ok(doctrines.some((d) => d.doctrineId === CANONICAL_DOCTRINE_IDS.EA_EXECUTION));
  });

  it("records CREATED lifecycle on seed and publish", () => {
    initializeDoctrines(WORKSPACE_ID);

    const seedLifecycle = listDoctrineLifecycle(CANONICAL_DOCTRINE_IDS.LIVING_SOUL);
    assert.ok(seedLifecycle.some((entry) => entry.event === "CREATED"));

    const custom = publishDoctrine({
      workspaceId: WORKSPACE_ID,
      doctrineId: "doctrine:custom-test",
      title: "Custom Doctrine",
      statement: "Test doctrine for lifecycle tracking",
      actor: "founder@test.com",
    });

    const customLifecycle = listDoctrineLifecycle(custom.doctrineId);
    assert.ok(customLifecycle.some((entry) => entry.event === "CREATED"));
  });

  it("tracks MODIFIED lifecycle and increments version", () => {
    initializeDoctrines(WORKSPACE_ID);

    const updated = modifyDoctrine({
      doctrineId: CANONICAL_DOCTRINE_IDS.REVENUE_TRUTH,
      statement: "Revenue must be ledger-backed with audit trail.",
      actor: "founder@test.com",
    });

    assert.equal(updated.version, 2);
    const lifecycle = listDoctrineLifecycle(CANONICAL_DOCTRINE_IDS.REVENUE_TRUTH);
    assert.ok(lifecycle.some((entry) => entry.event === "MODIFIED"));
  });

  it("tracks DEPRECATED and SUPERSEDED lifecycle", () => {
    initializeDoctrines(WORKSPACE_ID);

    const replacement = publishDoctrine({
      workspaceId: WORKSPACE_ID,
      doctrineId: "doctrine:replacement",
      title: "Replacement Doctrine",
      statement: "Supersedes sandbox-first",
      actor: "founder@test.com",
    });

    const deprecated = deprecateDoctrine(
      CANONICAL_DOCTRINE_IDS.LIVING_SOUL,
      "founder@test.com",
      "Merged into continuity framework",
    );
    assert.equal(deprecated.status, "DEPRECATED");
    assert.ok(
      listDoctrineLifecycle(CANONICAL_DOCTRINE_IDS.LIVING_SOUL).some(
        (entry) => entry.event === "DEPRECATED",
      ),
    );

    const superseded = supersedeDoctrine(
      CANONICAL_DOCTRINE_IDS.SANDBOX_FIRST,
      replacement.doctrineId,
      "founder@test.com",
    );
    assert.equal(superseded.status, "SUPERSEDED");
    assert.equal(superseded.supersededBy, replacement.doctrineId);
    assert.ok(
      listDoctrineLifecycle(CANONICAL_DOCTRINE_IDS.SANDBOX_FIRST).some(
        (entry) => entry.event === "SUPERSEDED",
      ),
    );
  });

  it("tracks REFERENCED lifecycle when doctrine is referenced", () => {
    initializeDoctrines(WORKSPACE_ID);

    const referenced = recordDoctrineReference(CANONICAL_DOCTRINE_IDS.NO_LIVE_WITHOUT_GATES, {
      actor: "orchestrator",
      module: "meta-ads-connector",
      action: "launch_campaign",
      correlationId: "corr-ref-1",
    });

    assert.equal(referenced.referenceCount, 1);
    const lifecycle = listDoctrineLifecycle(CANONICAL_DOCTRINE_IDS.NO_LIVE_WITHOUT_GATES);
    assert.ok(lifecycle.some((entry) => entry.event === "REFERENCED"));
  });

  it("compiles active doctrines into executable governance policies", () => {
    initializeDoctrines(WORKSPACE_ID);

    const policies = getExecutableDoctrinePolicies(WORKSPACE_ID);
    assert.ok(policies.length >= 4);
    assert.ok(
      policies.some(
        (policy) =>
          policy.policyId.startsWith(`policy:${CANONICAL_DOCTRINE_IDS.NO_LIVE_WITHOUT_GATES}:`) &&
          policy.metadata.source === "doctrine-engine",
      ),
    );
  });

  it("enforces doctrine-compiled policies through governance evaluation", () => {
    initializeDoctrines(WORKSPACE_ID);
    initializeGovernancePolicies(WORKSPACE_ID);

    const verdict = evaluateGovernanceDecision({
      workspaceId: WORKSPACE_ID,
      domain: "deployment",
      module: "production-deploy",
      action: "execute_vercel",
      payload: {},
    });

    assert.equal(verdict.allowed, false);
    assert.equal(verdict.requiresApproval, true);
    assert.ok(verdict.policyId?.startsWith("policy:doctrine:founder-sovereignty:"));

    const lifecycle = listDoctrineLifecycle(CANONICAL_DOCTRINE_IDS.FOUNDER_SOVEREIGNTY);
    assert.ok(lifecycle.some((entry) => entry.event === "REFERENCED"));
  });

  it("exposes doctrine operations via Brain tools", async () => {
    const listed = (await invokeTool("doctrine.list")) as { doctrines: unknown[] };
    assert.ok(Array.isArray(listed.doctrines));
    assert.ok(listed.doctrines.length >= 6);

    const policies = (await invokeTool("doctrine.list_executable_policies")) as {
      policies: unknown[];
    };
    assert.ok(Array.isArray(policies.policies));
    assert.ok(policies.policies.length >= 4);
  });
});
