import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ROLE_CATEGORIES,
  ROLE_RULES,
  RTX_CAPABILITIES,
  TAXONOMY_VERSION,
  buildRoleTaxonomyConfiguration,
  createRoleTaxonomy,
  resetRoleTaxonomyForTesting,
} from "../../role-taxonomy/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createRoleTaxonomy>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createRoleTaxonomy(bootstrap, config);
  await engine.initialize();
  engine.connectRoleTaxonomy();
  return engine;
}

describe("Q1-03 Role Taxonomy", () => {
  beforeEach(resetRoleTaxonomyForTesting);

  test("1 locks mandatory role-taxonomy boundaries", () => {
    const c = buildRoleTaxonomyConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverReplaceOrganizationCharter: false as never,
      neverReplaceWorkerConstitution: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverReplaceOrganizationCharter, true);
    assert.equal(c.neverReplaceWorkerConstitution, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-RTX-001 for Q1-03", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q1-03");
    assert.equal(state.engineVersion, "PILLOW-RTX-001");
    assert.equal(state.health.taxonomyVersion, TAXONOMY_VERSION);
    for (const rule of ROLE_RULES) {
      assert.ok(state.configuration.roleRules.includes(rule));
    }
    for (const category of ROLE_CATEGORIES) {
      assert.ok(state.configuration.roleCategories.includes(category));
    }
  });

  test("3 creates Role Taxonomy with multiple role categories registered", async () => {
    const report = (await build()).defineTaxonomy({ validated: true });
    assert.equal(report.action, "define_taxonomy");
    assert.ok(report.catalog);
    assert.equal(report.catalog!.taxonomyVersion, TAXONOMY_VERSION);
    assert.equal(report.catalog!.executiveAuthority, "pillow");
    assert.ok(report.catalog!.roles.length >= 10);
    const categories = new Set(report.catalog!.roles.map((r) => r.roleCategory));
    for (const category of ROLE_CATEGORIES) {
      assert.ok(categories.has(category), `missing category ${category}`);
    }
  });

  test("4 registers a new role into the taxonomy", async () => {
    const report = (await build()).registerRole({
      roleId: "role-specialist-commerce",
      roleName: "Commerce Specialist",
      roleCategory: "specialist",
      parentRole: "role-lead-team",
      purpose: "Specialize in commerce operations",
      responsibilities: ["commerce_execution"],
      decisionAuthority: ["decide_within_commerce_scope"],
      escalationAuthority: ["escalate_to_lead"],
      requiredSkills: ["commerce_ops"],
      reportingRelationship: "lead",
      validated: true,
    });
    assert.equal(report.action, "register_role");
    assert.ok(report.roles.some((r) => r.roleId === "role-specialist-commerce"));
  });

  test("5 validates role inheritance parent chain", async () => {
    const engine = await build();
    const report = engine.validateInheritance({
      roleId: "role-analyst-strategy",
      validated: true,
    });
    assert.equal(report.action, "validate_inheritance");
    assert.equal(report.taxonomyDecision, "valid");
    const analyst = report.roles.find((r) => r.roleId === "role-analyst-strategy")!;
    assert.equal(analyst.parentRole, "role-specialist-domain");
    assert.ok(
      report.roles.some((r) => r.roleId === "role-system-base"),
      "root role present",
    );
  });

  test("6 validates reporting relationships", async () => {
    const report = (await build()).validateReporting({
      roleId: "role-manager-department",
      validated: true,
    });
    assert.equal(report.action, "validate_reporting");
    assert.equal(report.taxonomyDecision, "valid");
    const manager = report.roles.find((r) => r.roleId === "role-manager-department")!;
    assert.equal(manager.reportingRelationship, "director");
    assert.ok(manager.decisionAuthority.length > 0);
    assert.ok(manager.escalationAuthority.length > 0);
  });

  test("7 inherits a taxonomy role for a worker", async () => {
    const report = (await build()).inheritRole({
      workerId: "wkr-strategy-01",
      workerName: "Strategy Analyst One",
      roleId: "role-analyst-strategy",
      validated: true,
    });
    assert.equal(report.action, "inherit_role");
    assert.equal(report.inheritanceRecords.length, 1);
    const record = report.inheritanceRecords[0]!;
    assert.equal(record.workerId, "wkr-strategy-01");
    assert.equal(record.roleId, "role-analyst-strategy");
    assert.equal(record.inherited, true);
    assert.ok(record.parentChain.includes("role-specialist-domain"));
    assert.ok(record.inheritanceId.startsWith("rtx-inh-"));
  });

  test("8 rejects execute / charter / constitution / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.defineTaxonomy({ validated: true, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.registerRole({
        roleId: "x",
        replaceOrganizationCharter: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.inheritRole({
        workerId: "w",
        replaceWorkerConstitution: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateReporting({ validated: true, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateInheritance({ validated: true, overrideGrandKing: true }).validation
        .decision,
      "fail",
    );
    assert.ok(RTX_CAPABILITIES.includes("extensible_role_categories"));
  });

  test("9 produces machine-readable role definitions", async () => {
    const engine = await build();
    engine.inheritRole({
      workerId: "wkr-ops-02",
      workerName: "Ops Support",
      roleId: "role-support-ops",
      validated: true,
    });
    const report = engine.produceTaxonomy({ validated: true });
    const catalog = report.catalog!;
    assert.ok(catalog.taxonomyVersion);
    assert.equal(catalog.executiveAuthority, "pillow");
    assert.ok(Array.isArray(catalog.categories));
    assert.ok(Array.isArray(catalog.roles));
    const role = catalog.roles[0]!;
    assert.ok(role.roleId);
    assert.ok(role.roleName);
    assert.ok(role.roleCategory);
    assert.ok(Array.isArray(role.responsibilities));
    assert.ok(role.authorityLevel);
    assert.ok(role.reportingRelationship);
    assert.ok(Array.isArray(role.collaborationRules));
    assert.ok(Array.isArray(role.escalationRules));
    assert.ok(Array.isArray(role.governanceRules));
    assert.equal(role.metadataVersion, "RTX-001-v1");
    assert.equal(catalog.metadataVersion, "RTX-001-v1");
  });

  test("10 validates inheritance records remain non-executing and Pillow-governed", async () => {
    const engine = await build();
    engine.inheritRole({
      workerId: "wkr-review-01",
      workerName: "Peer Reviewer",
      roleId: "role-reviewer-peer",
      validated: true,
    });
    const validation = engine.validateRoleTaxonomy({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    const record = engine.getLatestRecord()!;
    assert.equal(record.workerTasksExecuted, false);
    assert.equal(record.organizationCharterReplaced, false);
    assert.equal(record.workerConstitutionReplaced, false);
    assert.equal(record.pillowOverridden, false);
    assert.equal(record.grandKingOverridden, false);
    assert.equal(record.metadataVersion, "RTX-001-v1");
    assert.equal(engine.getCatalog()!.neverOverridePillow, true);
    assert.ok(["temporary", "shared", "cross_functional"].every((kind) =>
      engine.getRoles().some((r) => r.roleKind === kind),
    ));
  });
});
