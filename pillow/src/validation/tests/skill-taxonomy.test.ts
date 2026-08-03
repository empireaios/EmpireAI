import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  PROFICIENCY_LEVELS,
  SKILL_CATEGORIES,
  SKILL_RULES,
  STX_CAPABILITIES,
  TAXONOMY_VERSION,
  buildSkillTaxonomyConfiguration,
  createSkillTaxonomy,
  resetSkillTaxonomyForTesting,
} from "../../skill-taxonomy/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createSkillTaxonomy>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createSkillTaxonomy(bootstrap, config);
  await engine.initialize();
  engine.connectSkillTaxonomy();
  return engine;
}

describe("Q1-04 Skill Taxonomy", () => {
  beforeEach(resetSkillTaxonomyForTesting);

  test("1 locks mandatory skill-taxonomy boundaries", () => {
    const c = buildSkillTaxonomyConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverReplaceRoleTaxonomy: false as never,
      neverReplaceWorkforceCapabilityRegistry: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverReplaceRoleTaxonomy, true);
    assert.equal(c.neverReplaceWorkforceCapabilityRegistry, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-STX-001 for Q1-04", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q1-04");
    assert.equal(state.engineVersion, "PILLOW-STX-001");
    assert.equal(state.health.taxonomyVersion, TAXONOMY_VERSION);
    for (const rule of SKILL_RULES) {
      assert.ok(state.configuration.skillRules.includes(rule));
    }
    for (const category of SKILL_CATEGORIES) {
      assert.ok(state.configuration.skillCategories.includes(category));
    }
    for (const level of PROFICIENCY_LEVELS) {
      assert.ok(state.configuration.proficiencyLevels.includes(level));
    }
  });

  test("3 creates Skill Taxonomy with skills registered across categories", async () => {
    const report = (await build()).defineTaxonomy({ validated: true });
    assert.equal(report.action, "define_taxonomy");
    assert.ok(report.catalog);
    assert.equal(report.catalog!.taxonomyVersion, TAXONOMY_VERSION);
    assert.equal(report.catalog!.executiveAuthority, "pillow");
    assert.ok(report.catalog!.skills.length >= 12);
    const categories = new Set(report.catalog!.skills.map((s) => s.skillCategory));
    for (const category of SKILL_CATEGORIES) {
      assert.ok(categories.has(category), `missing category ${category}`);
    }
  });

  test("4 registers a new skill into the taxonomy", async () => {
    const report = (await build()).registerSkill({
      skillId: "skill-commerce-sourcing",
      skillName: "Commerce Sourcing",
      skillCategory: "commerce",
      parentSkill: "skill-commerce-marketplace",
      purpose: "Source suppliers within commerce policy",
      proficiencyLevel: "intermediate",
      requiredTools: ["supplier_directory"],
      capabilityLimits: ["no_unapproved_contracts"],
      requiredKnowledge: ["supplier_evaluation"],
      validationMethod: "sourcing_review",
      certificationRequirements: ["commerce_ops_cert"],
      validated: true,
    });
    assert.equal(report.action, "register_skill");
    assert.ok(report.skills.some((s) => s.skillId === "skill-commerce-sourcing"));
  });

  test("5 validates skill hierarchy parent chain", async () => {
    const report = (await build()).validateHierarchy({
      skillId: "skill-engineering-automation",
      validated: true,
    });
    assert.equal(report.action, "validate_hierarchy");
    assert.equal(report.taxonomyDecision, "valid");
    const skill = report.skills.find((s) => s.skillId === "skill-engineering-automation")!;
    assert.equal(skill.parentSkill, "skill-engineering-software");
    assert.ok(report.skills.some((s) => s.skillId === "skill-ops-foundation"));
  });

  test("6 validates proficiency levels", async () => {
    const report = (await build()).validateProficiency({
      skillId: "skill-executive-direction",
      validated: true,
    });
    assert.equal(report.action, "validate_proficiency");
    assert.equal(report.taxonomyDecision, "valid");
    const skill = report.skills.find((s) => s.skillId === "skill-executive-direction")!;
    assert.equal(skill.proficiencyLevel, "master");
    assert.ok(PROFICIENCY_LEVELS.includes(skill.proficiencyLevel as (typeof PROFICIENCY_LEVELS)[number]));
  });

  test("7 derives worker skills from taxonomy", async () => {
    const report = (await build()).deriveWorkerSkills({
      workerId: "wkr-eng-01",
      workerName: "Automation Engineer",
      skillIds: ["skill-engineering-automation", "skill-analytics-metrics"],
      validated: true,
    });
    assert.equal(report.action, "derive_worker_skills");
    assert.equal(report.derivationRecords.length, 1);
    const record = report.derivationRecords[0]!;
    assert.equal(record.workerId, "wkr-eng-01");
    assert.equal(record.derived, true);
    assert.ok(record.skillIds.includes("skill-engineering-automation"));
    assert.ok(record.skillIds.includes("skill-analytics-metrics"));
    assert.ok(record.parentChains["skill-engineering-automation"]!.includes("skill-engineering-software"));
    assert.ok(record.derivationId.startsWith("stx-drv-"));
  });

  test("8 rejects execute / role-taxonomy / WCR / Pillow / Grand King boundaries", async () => {
    const engine = await build();
    assert.equal(
      engine.defineTaxonomy({ validated: true, executeWorkerTasks: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.registerSkill({
        skillId: "x",
        replaceRoleTaxonomy: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.deriveWorkerSkills({
        workerId: "w",
        replaceWorkforceCapabilityRegistry: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateHierarchy({ validated: true, overridePillow: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateProficiency({ validated: true, overrideGrandKing: true }).validation
        .decision,
      "fail",
    );
    assert.ok(STX_CAPABILITIES.includes("extensible_skill_categories"));
    assert.ok(STX_CAPABILITIES.includes("extensible_proficiency_levels"));
  });

  test("9 produces machine-readable skill definitions", async () => {
    const engine = await build();
    engine.deriveWorkerSkills({
      workerId: "wkr-support-02",
      workerName: "Support Agent",
      skillIds: ["skill-customer-support-service"],
      validated: true,
    });
    const report = engine.produceTaxonomy({ validated: true });
    const catalog = report.catalog!;
    assert.ok(catalog.taxonomyVersion);
    assert.equal(catalog.executiveAuthority, "pillow");
    assert.ok(Array.isArray(catalog.categories));
    assert.ok(Array.isArray(catalog.proficiencyLevels));
    assert.ok(Array.isArray(catalog.skills));
    const skill = catalog.skills[0]!;
    assert.ok(skill.skillId);
    assert.ok(skill.skillName);
    assert.ok(skill.skillCategory);
    assert.ok(skill.description);
    assert.ok(skill.proficiencyLevel);
    assert.ok(Array.isArray(skill.requiredTools));
    assert.ok(Array.isArray(skill.capabilityLimits));
    assert.ok(Array.isArray(skill.validationRules));
    assert.ok(Array.isArray(skill.certificationRequirements));
    assert.equal(skill.metadataVersion, "STX-001-v1");
    assert.equal(catalog.metadataVersion, "STX-001-v1");
  });

  test("10 validates derivation records remain non-executing and Pillow-governed", async () => {
    const engine = await build();
    engine.deriveWorkerSkills({
      workerId: "wkr-sec-01",
      workerName: "Security Analyst",
      skillIds: ["skill-security-controls"],
      validated: true,
    });
    const validation = engine.validateSkillTaxonomy({ validated: true });
    assert.ok(
      validation.validation.decision === "pass" || validation.validation.decision === "partial",
    );
    const record = engine.getLatestRecord()!;
    assert.equal(record.workerTasksExecuted, false);
    assert.equal(record.roleTaxonomyReplaced, false);
    assert.equal(record.workforceCapabilityRegistryReplaced, false);
    assert.equal(record.pillowOverridden, false);
    assert.equal(record.grandKingOverridden, false);
    assert.equal(record.metadataVersion, "STX-001-v1");
    assert.equal(engine.getCatalog()!.neverOverridePillow, true);
    assert.ok(record.skillIds.length >= 1);
  });
});
