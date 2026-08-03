import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  MATRIX_VERSION,
  RESPONSIBILITY_RULES,
  RMX_CAPABILITIES,
  buildResponsibilityMatrixConfiguration,
  createResponsibilityMatrix,
  resetResponsibilityMatrixForTesting,
} from "../../responsibility-matrix/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createResponsibilityMatrix>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createResponsibilityMatrix(bootstrap, config);
  await engine.initialize();
  engine.connectResponsibilityMatrix();
  return engine;
}

describe("Q1-06 Responsibility Matrix", () => {
  beforeEach(resetResponsibilityMatrixForTesting);

  test("1 locks mandatory responsibility-matrix boundaries", () => {
    const c = buildResponsibilityMatrixConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverReplaceAuthorityMatrix: false as never,
      neverReplaceOrganizationCharter: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverReplaceAuthorityMatrix, true);
    assert.equal(c.neverReplaceOrganizationCharter, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-RMX-001 for Q1-06", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q1-06");
    assert.equal(state.engineVersion, "PILLOW-RMX-001");
    assert.equal(state.health.matrixVersion, MATRIX_VERSION);
    for (const rule of RESPONSIBILITY_RULES) {
      assert.ok(state.configuration.responsibilityRules.includes(rule));
    }
  });

  test("3 creates Responsibility Matrix with owned responsibilities", async () => {
    const report = (await build()).defineMatrix({ validated: true });
    assert.equal(report.action, "define_matrix");
    assert.ok(report.catalog);
    assert.equal(report.catalog!.matrixVersion, MATRIX_VERSION);
    assert.equal(report.catalog!.executiveAuthority, "pillow");
    assert.ok(report.catalog!.responsibilities.length >= 8);
    assert.ok(
      report.catalog!.responsibilities.every(
        (r) => !!r.primaryOwner && !r.primaryOwner.includes(","),
      ),
    );
  });

  test("4 validates worker ownership (exactly one accountable owner)", async () => {
    const report = (await build()).validateOwnership({
      responsibilityId: "resp-strategy-briefs",
      validated: true,
    });
    assert.equal(report.action, "validate_ownership");
    assert.equal(report.matrixDecision, "valid");
    const responsibility = report.responsibilities.find(
      (r) => r.responsibilityId === "resp-strategy-briefs",
    )!;
    assert.equal(responsibility.primaryOwner, "wkr-strategy-01");
    assert.ok(responsibility.supportingWorkers.includes("wkr-research-01"));
  });

  test("5 validates inputs and outputs mapping", async () => {
    const report = (await build()).validateInputsOutputs({
      responsibilityId: "resp-commerce-listings",
      validated: true,
    });
    assert.equal(report.action, "validate_inputs_outputs");
    assert.equal(report.matrixDecision, "valid");
    const responsibility = report.responsibilities.find(
      (r) => r.responsibilityId === "resp-commerce-listings",
    )!;
    assert.ok(responsibility.requiredInputs.includes("product_spec"));
    assert.ok(responsibility.expectedOutputs.includes("listing_draft"));
  });

  test("6 validates dependency chains", async () => {
    const report = (await build()).validateDependencies({
      responsibilityId: "resp-engineering-change",
      validated: true,
    });
    assert.equal(report.action, "validate_dependencies");
    assert.equal(report.matrixDecision, "valid");
    const responsibility = report.responsibilities.find(
      (r) => r.responsibilityId === "resp-engineering-change",
    )!;
    assert.ok(responsibility.dependencies.includes("resp-security-review"));
    assert.ok(
      report.responsibilities.some((r) => r.responsibilityId === "resp-security-review"),
    );
  });

  test("7 validates approval requirements", async () => {
    const report = (await build()).validateApprovals({
      responsibilityId: "resp-finance-analysis",
      validated: true,
    });
    assert.equal(report.action, "validate_approvals");
    assert.equal(report.matrixDecision, "valid");
    const responsibility = report.responsibilities.find(
      (r) => r.responsibilityId === "resp-finance-analysis",
    )!;
    assert.ok(responsibility.requiredApprovals.includes("pillow_approval"));
    assert.ok(responsibility.escalationPath.includes("pillow"));
  });

  test("8 rejects execute / authority-matrix / charter / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.defineMatrix({ validated: true, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.registerResponsibility({
        responsibilityId: "x",
        replaceAuthorityMatrix: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.deriveOwnership({
        subjectId: "w",
        replaceOrganizationCharter: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateOwnership({ validated: true, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateApprovals({ validated: true, overrideGrandKing: true }).validation.decision,
      "fail",
    );
    assert.ok(RMX_CAPABILITIES.includes("define_responsibility_ownership"));
  });

  test("9 produces machine-readable responsibility definitions", async () => {
    const engine = await build();
    engine.deriveOwnership({
      subjectId: "wkr-ops-01",
      subjectType: "worker",
      responsibilityIds: ["resp-ops-runbook", "resp-customer-support"],
      validated: true,
    });
    const report = engine.produceMatrix({ validated: true });
    const catalog = report.catalog!;
    assert.ok(catalog.matrixVersion);
    assert.equal(catalog.executiveAuthority, "pillow");
    assert.ok(Array.isArray(catalog.responsibilities));
    const responsibility = catalog.responsibilities[0]!;
    assert.ok(responsibility.responsibilityId);
    assert.ok(responsibility.responsibilityName);
    assert.ok(responsibility.primaryOwner);
    assert.ok(Array.isArray(responsibility.supportingWorkers));
    assert.ok(responsibility.department);
    assert.ok(responsibility.factory);
    assert.ok(Array.isArray(responsibility.requiredInputs));
    assert.ok(Array.isArray(responsibility.expectedOutputs));
    assert.ok(Array.isArray(responsibility.dependencies));
    assert.ok(Array.isArray(responsibility.requiredApprovals));
    assert.ok(Array.isArray(responsibility.successCriteria));
    assert.ok(Array.isArray(responsibility.failureConditions));
    assert.ok(responsibility.escalationTarget);
    assert.equal(responsibility.metadataVersion, "RMX-001-v1");
    assert.equal(catalog.metadataVersion, "RMX-001-v1");
  });

  test("10 validates bindings remain non-executing and Pillow-governed", async () => {
    const engine = await build();
    engine.deriveOwnership({
      subjectId: "dept-security",
      subjectType: "department",
      responsibilityIds: ["resp-security-review"],
      validated: true,
    });
    const validation = engine.validateResponsibilityMatrix({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    const binding = engine.getLatestBinding()!;
    assert.equal(binding.workerTasksExecuted, false);
    assert.equal(binding.authorityMatrixReplaced, false);
    assert.equal(binding.organizationCharterReplaced, false);
    assert.equal(binding.pillowOverridden, false);
    assert.equal(binding.grandKingOverridden, false);
    assert.equal(binding.metadataVersion, "RMX-001-v1");
    assert.equal(engine.getCatalog()!.neverOverridePillow, true);
    assert.equal(binding.ownerMap["resp-security-review"], "wkr-security-01");
  });
});
