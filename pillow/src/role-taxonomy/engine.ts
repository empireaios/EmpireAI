import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildRoleTaxonomyConfiguration,
  type RoleTaxonomyConfiguration,
} from "./configuration.js";
import { resetInheritanceSequenceForTesting } from "./taxonomy-store.js";
import { ROLE_TAXONOMY_SYSTEM_PATH } from "./paths.js";
import { RoleTaxonomyController } from "./role-taxonomy-controller.js";
import { RoleTaxonomyCore } from "./role-taxonomy-core.js";
import { resetRtxLogsForTesting } from "./rtx-logging.js";
import type {
  RoleTaxonomyCockpitSnapshot,
  RoleTaxonomyInput,
  RoleTaxonomyState,
} from "./types.js";

export interface RoleTaxonomyOptions {
  configuration?: Partial<RoleTaxonomyConfiguration>;
}

/** Authoritative Q1-03 Role Taxonomy — define and inherit only. */
export class RoleTaxonomy {
  private initializedAt: string | null = null;
  private readonly controller: RoleTaxonomyController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: RoleTaxonomyOptions = {},
  ) {
    this.controller = new RoleTaxonomyController(
      new RoleTaxonomyCore(),
      buildRoleTaxonomyConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      ROLE_TAXONOMY_SYSTEM_PATH,
    );
    if (!doc?.includes("Role Taxonomy")) {
      throw new Error(`${ROLE_TAXONOMY_SYSTEM_PATH} missing — Q1-03 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): RoleTaxonomyState {
    if (!this.initializedAt) {
      throw new Error("Role Taxonomy not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-RTX-001",
      missionId: "Q1-03",
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
        totalRoles: engineRecord?.totalRoles ?? 0,
        totalInheritanceRecords: this.getRecords().length,
        categoryCount: engineRecord?.categoryCount ?? 0,
        lastTaxonomyDecision: engineRecord?.lastTaxonomyDecision ?? null,
        notes: [
          "Define only: does not execute worker tasks, replace Organization Charter, replace Worker Constitution, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectRoleTaxonomy(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  defineTaxonomy(input: RoleTaxonomyInput = {}) {
    return this.controller.defineTaxonomy(input);
  }

  registerRole(input: RoleTaxonomyInput = {}) {
    return this.controller.registerRole(input);
  }

  inheritRole(input: RoleTaxonomyInput = {}) {
    return this.controller.inheritRole(input);
  }

  validateReporting(input: RoleTaxonomyInput = {}) {
    return this.controller.validateReporting(input);
  }

  validateInheritance(input: RoleTaxonomyInput = {}) {
    return this.controller.validateInheritance(input);
  }

  produceTaxonomy(input: RoleTaxonomyInput = {}) {
    return this.controller.produceTaxonomy(input);
  }

  listTaxonomyRecords() {
    return this.controller.list();
  }

  validateRoleTaxonomy(input: RoleTaxonomyInput = {}) {
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

  getRoles() {
    return this.controller.getManager().getRoles();
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
        `Roles: ${state.health.totalRoles}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RoleTaxonomyCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q1-03",
      status: state.status,
      healthStatus: state.health.status,
      taxonomyVersion: state.health.taxonomyVersion,
      totalRoles: state.health.totalRoles,
      categoryCount: state.health.categoryCount,
      latestInheritanceId: this.getLatestRecord()?.inheritanceId ?? null,
      neverExecuteWorkerTasks: true,
      neverReplaceOrganizationCharter: true,
      neverReplaceWorkerConstitution: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createRoleTaxonomy(
  bootstrap: EmpireBootstrapContext,
  options?: RoleTaxonomyOptions,
) {
  return new RoleTaxonomy(bootstrap, options);
}

export function resetRoleTaxonomyForTesting() {
  resetRtxLogsForTesting();
  resetInheritanceSequenceForTesting();
}
