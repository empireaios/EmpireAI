import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AMX_CAPABILITIES,
  AUTHORITY_LEVELS,
  AUTHORITY_RULES,
  DECISION_CATEGORIES,
  MATRIX_VERSION,
  buildAuthorityMatrixConfiguration,
  createAuthorityMatrix,
  resetAuthorityMatrixForTesting,
} from "../../authority-matrix/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createAuthorityMatrix>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createAuthorityMatrix(bootstrap, config);
  await engine.initialize();
  engine.connectAuthorityMatrix();
  return engine;
}

describe("Q1-05 Authority Matrix", () => {
  beforeEach(resetAuthorityMatrixForTesting);

  test("1 locks mandatory authority-matrix boundaries", () => {
    const c = buildAuthorityMatrixConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverReplaceApprovalRouter: false as never,
      neverReplaceOrganizationCharter: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverReplaceApprovalRouter, true);
    assert.equal(c.neverReplaceOrganizationCharter, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-AMX-001 for Q1-05", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q1-05");
    assert.equal(state.engineVersion, "PILLOW-AMX-001");
    assert.equal(state.health.matrixVersion, MATRIX_VERSION);
    for (const rule of AUTHORITY_RULES) {
      assert.ok(state.configuration.authorityRules.includes(rule));
    }
    for (const level of AUTHORITY_LEVELS) {
      assert.ok(state.configuration.authorityLevels.includes(level));
    }
    for (const category of DECISION_CATEGORIES) {
      assert.ok(state.configuration.decisionCategories.includes(category));
    }
  });

  test("3 creates Authority Matrix with rules across decision categories", async () => {
    const report = (await build()).defineMatrix({ validated: true });
    assert.equal(report.action, "define_matrix");
    assert.ok(report.catalog);
    assert.equal(report.catalog!.matrixVersion, MATRIX_VERSION);
    assert.equal(report.catalog!.executiveAuthority, "pillow");
    assert.equal(report.catalog!.supremeAuthority, "grand_king");
    assert.ok(report.catalog!.rules.length >= 11);
    const categories = new Set(report.catalog!.rules.map((r) => r.decisionCategory));
    for (const category of DECISION_CATEGORIES) {
      assert.ok(categories.has(category), `missing category ${category}`);
    }
  });

  test("4 validates worker authority", async () => {
    const report = (await build()).validateWorkerAuthority({
      authorityId: "auth-base-information",
      validated: true,
    });
    assert.equal(report.action, "validate_worker_authority");
    assert.equal(report.matrixDecision, "valid");
    const rule = report.rules.find((r) => r.authorityId === "auth-base-information")!;
    assert.equal(rule.requiredApproval, "autonomous_worker_decision");
    assert.ok(rule.whoMayPerform.includes("specialist"));
  });

  test("5 validates Pillow executive authority", async () => {
    const report = (await build()).validatePillowAuthority({ validated: true });
    assert.equal(report.action, "validate_pillow_authority");
    assert.equal(report.matrixDecision, "valid");
    assert.equal(report.catalog!.executiveAuthority, "pillow");
    const pillow = report.rules.find((r) => r.authorityId === "auth-pillow-executive")!;
    assert.ok(pillow.whoMayPerform.includes("pillow"));
    assert.ok(pillow.restrictedActions.includes("override_grand_king"));
  });

  test("6 validates Grand King supreme authority", async () => {
    const report = (await build()).validateGrandKingAuthority({ validated: true });
    assert.equal(report.action, "validate_grand_king_authority");
    assert.equal(report.matrixDecision, "valid");
    assert.equal(report.catalog!.supremeAuthority, "grand_king");
    const gk = report.rules.find((r) => r.authorityId === "auth-grand-king-supreme")!;
    assert.ok(gk.whoMayPerform.includes("grand_king"));
    assert.equal(gk.requiredApproval, "grand_king_approval");
  });

  test("7 validates approval routing and escalation paths", async () => {
    const report = (await build()).validateApprovalRouting({
      authorityId: "auth-financial",
      validated: true,
    });
    assert.equal(report.action, "validate_approval_routing");
    assert.equal(report.matrixDecision, "valid");
    const rule = report.rules.find((r) => r.authorityId === "auth-financial")!;
    assert.equal(rule.requiredApproval, "pillow_approval");
    assert.ok(rule.escalationPath.includes("pillow"));
    assert.ok(rule.escalationPath.includes("grand_king"));
  });

  test("8 rejects execute / approval-router / charter / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.defineMatrix({ validated: true, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.registerRule({
        authorityId: "x",
        replaceApprovalRouter: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.deriveAuthority({
        subjectId: "w",
        replaceOrganizationCharter: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateWorkerAuthority({ validated: true, overridePillow: true }).validation
        .decision,
      "fail",
    );
    assert.equal(
      engine.validateGrandKingAuthority({ validated: true, overrideGrandKing: true }).validation
        .decision,
      "fail",
    );
    assert.ok(AMX_CAPABILITIES.includes("extensible_authority_levels"));
    assert.ok(AMX_CAPABILITIES.includes("extensible_decision_categories"));
  });

  test("9 produces machine-readable authority definitions", async () => {
    const engine = await build();
    engine.deriveAuthority({
      subjectId: "wkr-ops-01",
      subjectType: "worker",
      authorityIds: ["auth-planning", "auth-marketplace"],
      validated: true,
    });
    const report = engine.produceMatrix({ validated: true });
    const catalog = report.catalog!;
    assert.ok(catalog.matrixVersion);
    assert.equal(catalog.executiveAuthority, "pillow");
    assert.equal(catalog.supremeAuthority, "grand_king");
    assert.ok(Array.isArray(catalog.authorityLevels));
    assert.ok(Array.isArray(catalog.decisionCategories));
    assert.ok(Array.isArray(catalog.rules));
    const rule = catalog.rules[0]!;
    assert.ok(rule.authorityId);
    assert.ok(rule.decisionCategory);
    assert.ok(rule.workerRole);
    assert.ok(Array.isArray(rule.permittedActions));
    assert.ok(Array.isArray(rule.restrictedActions));
    assert.ok(rule.requiredApproval);
    assert.ok(rule.escalationTarget);
    assert.ok(rule.riskClassification);
    assert.equal(rule.metadataVersion, "AMX-001-v1");
    assert.equal(catalog.metadataVersion, "AMX-001-v1");
  });

  test("10 validates bindings remain non-executing and Pillow/Grand-King governed", async () => {
    const engine = await build();
    engine.deriveAuthority({
      subjectId: "factory-ops",
      subjectType: "factory",
      authorityIds: ["auth-infrastructure"],
      validated: true,
    });
    const validation = engine.validateAuthorityMatrix({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    const binding = engine.getLatestBinding()!;
    assert.equal(binding.workerTasksExecuted, false);
    assert.equal(binding.approvalRouterReplaced, false);
    assert.equal(binding.organizationCharterReplaced, false);
    assert.equal(binding.pillowOverridden, false);
    assert.equal(binding.grandKingOverridden, false);
    assert.equal(binding.metadataVersion, "AMX-001-v1");
    assert.equal(engine.getCatalog()!.neverOverridePillow, true);
    assert.equal(engine.getCatalog()!.neverOverrideGrandKing, true);
    assert.ok(binding.authorityIds.length >= 1);
  });
});
