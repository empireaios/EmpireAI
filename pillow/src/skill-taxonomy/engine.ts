import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSkillTaxonomyConfiguration,
  type SkillTaxonomyConfiguration,
} from "./configuration.js";
import { resetDerivationSequenceForTesting } from "./taxonomy-store.js";
import { SKILL_TAXONOMY_SYSTEM_PATH } from "./paths.js";
import { SkillTaxonomyController } from "./skill-taxonomy-controller.js";
import { SkillTaxonomyCore } from "./skill-taxonomy-core.js";
import { resetStxLogsForTesting } from "./stx-logging.js";
import type {
  SkillTaxonomyCockpitSnapshot,
  SkillTaxonomyInput,
  SkillTaxonomyState,
} from "./types.js";

export interface SkillTaxonomyOptions {
  configuration?: Partial<SkillTaxonomyConfiguration>;
}

/** Authoritative Q1-04 Skill Taxonomy — define and derive only. */
export class SkillTaxonomy {
  private initializedAt: string | null = null;
  private readonly controller: SkillTaxonomyController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: SkillTaxonomyOptions = {},
  ) {
    this.controller = new SkillTaxonomyController(
      new SkillTaxonomyCore(),
      buildSkillTaxonomyConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      SKILL_TAXONOMY_SYSTEM_PATH,
    );
    if (!doc?.includes("Skill Taxonomy")) {
      throw new Error(`${SKILL_TAXONOMY_SYSTEM_PATH} missing — Q1-04 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): SkillTaxonomyState {
    if (!this.initializedAt) {
      throw new Error("Skill Taxonomy not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-STX-001",
      missionId: "Q1-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        taxonomyVersion: configuration.taxonomyVersion,
        totalSkills: engineRecord?.totalSkills ?? 0,
        totalDerivationRecords: this.getRecords().length,
        categoryCount: engineRecord?.categoryCount ?? 0,
        proficiencyLevelCount: engineRecord?.proficiencyLevelCount ?? 0,
        lastTaxonomyDecision: engineRecord?.lastTaxonomyDecision ?? null,
        notes: [
          "Define only: does not execute worker tasks, replace Role Taxonomy, replace Workforce Capability Registry, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectSkillTaxonomy(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  defineTaxonomy(input: SkillTaxonomyInput = {}) {
    return this.controller.defineTaxonomy(input);
  }

  registerSkill(input: SkillTaxonomyInput = {}) {
    return this.controller.registerSkill(input);
  }

  deriveWorkerSkills(input: SkillTaxonomyInput = {}) {
    return this.controller.deriveWorkerSkills(input);
  }

  validateHierarchy(input: SkillTaxonomyInput = {}) {
    return this.controller.validateHierarchy(input);
  }

  validateProficiency(input: SkillTaxonomyInput = {}) {
    return this.controller.validateProficiency(input);
  }

  produceTaxonomy(input: SkillTaxonomyInput = {}) {
    return this.controller.produceTaxonomy(input);
  }

  listTaxonomyRecords() {
    return this.controller.list();
  }

  validateSkillTaxonomy(input: SkillTaxonomyInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  getLatestRecord() {
    return this.controller.getManager().getLatestRecord();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getSkills() {
    return this.controller.getManager().getSkills();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Taxonomy: ${state.health.taxonomyVersion}`,
        `Skills: ${state.health.totalSkills}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SkillTaxonomyCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q1-04",
      status: state.status,
      healthStatus: state.health.status,
      taxonomyVersion: state.health.taxonomyVersion,
      totalSkills: state.health.totalSkills,
      categoryCount: state.health.categoryCount,
      proficiencyLevelCount: state.health.proficiencyLevelCount,
      latestDerivationId: this.getLatestRecord()?.derivationId ?? null,
      neverExecuteWorkerTasks: true,
      neverReplaceRoleTaxonomy: true,
      neverReplaceWorkforceCapabilityRegistry: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createSkillTaxonomy(
  bootstrap: EmpireBootstrapContext,
  options?: SkillTaxonomyOptions,
) {
  return new SkillTaxonomy(bootstrap, options);
}

export function resetSkillTaxonomyForTesting() {
  resetStxLogsForTesting();
  resetDerivationSequenceForTesting();
}
