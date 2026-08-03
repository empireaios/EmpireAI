import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAffiliateFactoryCoreConfiguration,
  type AffiliateFactoryCoreConfiguration,
} from "./configuration.js";
import type { AffiliateFactoryCoreDependencies } from "./integrations.js";
import { AffiliateFactoryCoreController } from "./affiliate-factory-core-controller.js";
import { resetAfcLogsForTesting } from "./afc-logging.js";
import { AFFILIATE_FACTORY_CORE_SYSTEM_PATH } from "./paths.js";
import { resetProjectSequenceForTesting } from "./project-builder.js";
import { AffiliateFactoryManager } from "./factory-manager.js";
import type {
  AfcInput,
  AffiliateFactoryCoreCockpitSnapshot,
  AffiliateFactoryCoreState,
} from "./types.js";

export interface AffiliateFactoryCoreOptions {
  configuration?: Partial<AffiliateFactoryCoreConfiguration>;
  dependencies?: AffiliateFactoryCoreDependencies;
}

/**
 * Authoritative Q8-01 Affiliate Factory Core — executive orchestration only.
 *
 * AFC orchestrates affiliate business projects (registration, lifecycle, worker role
 * coordination, dependency management, readiness monitoring, reporting). It does NOT
 * discover affiliate programmes, generate affiliate content, or launch businesses
 * automatically — those remain out of scope for Q8-02 and later specialist workers.
 */
export class AffiliateFactoryCore {
  private initializedAt: string | null = null;
  private readonly controller: AffiliateFactoryCoreController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: AffiliateFactoryCoreOptions = {},
  ) {
    const manager = new AffiliateFactoryManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new AffiliateFactoryCoreController(
      manager,
      buildAffiliateFactoryCoreConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      AFFILIATE_FACTORY_CORE_SYSTEM_PATH,
    );
    if (!doc?.includes("Affiliate Factory Core")) {
      throw new Error(`${AFFILIATE_FACTORY_CORE_SYSTEM_PATH} missing — Q8-01 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: AffiliateFactoryCoreDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): AffiliateFactoryCoreState {
    if (!this.initializedAt) {
      throw new Error("Affiliate Factory Core not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-AFC-001",
      missionId: "Q8-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalProjects: engineRecord?.totalProjects ?? 0,
        lastProjectId: engineRecord?.lastProjectId ?? null,
        notes: [
          "Orchestration-only: does not discover affiliate programmes, generate affiliate content, launch businesses automatically, fabricate worker status, bypass Grand King approval, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  createAffiliateBusinessProject(input: AfcInput = {}) {
    return this.controller.registerAffiliateBusinessProject(input);
  }

  registerAffiliateBusinessProject(input: AfcInput = {}) {
    return this.controller.registerAffiliateBusinessProject(input);
  }

  manageLifecycle(input: AfcInput = {}) {
    return this.controller.coordinateLifecycle(input);
  }

  coordinateLifecycle(input: AfcInput = {}) {
    return this.controller.coordinateLifecycle(input);
  }

  coordinateWorkers(input: AfcInput = {}) {
    return this.controller.coordinateWorkers(input);
  }

  assignWorkers(input: AfcInput = {}) {
    return this.controller.assignWorkers(input);
  }

  trackProjectStatus(input: AfcInput = {}) {
    return this.controller.trackProjectStatus(input);
  }

  trackProjectProgress(input: AfcInput = {}) {
    return this.controller.trackProjectProgress(input);
  }

  manageWorkerDependencies(input: AfcInput = {}) {
    return this.controller.manageWorkerDependencies(input);
  }

  maintainBusinessMetadata(input: AfcInput = {}) {
    return this.controller.maintainBusinessMetadata(input);
  }

  monitorFactoryReadiness() {
    return this.controller.monitorFactoryReadiness();
  }

  produceExecutiveSummary(input: AfcInput = {}) {
    return this.controller.produceExecutiveSummary(input);
  }

  produceReport(input: AfcInput = {}) {
    return this.controller.produceReport(input);
  }

  produceAffiliateFactoryReport(input: AfcInput = {}) {
    return this.controller.produceAffiliateFactoryReport(input);
  }

  submitReport(input: AfcInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getProjects() {
    return this.controller.getManager().getProjects();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestProjectId() {
    return this.controller.getManager().getLatestProjectId();
  }

  getLatestAffiliateBusinessId() {
    return this.controller.getManager().getLatestAffiliateBusinessId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  getQ802ConsumableContract() {
    return this.controller.getQ802ConsumableContract();
  }

  validate(input: AfcInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
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
        score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Affiliate business projects: ${state.health.totalProjects}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AffiliateFactoryCoreCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q8-01",
      status: state.status,
      healthStatus: state.health.status,
      totalProjects: state.health.totalProjects,
      latestAffiliateBusinessId: this.getLatestAffiliateBusinessId(),
      workerId: state.configuration.workerId,
      neverDiscoverAffiliateProgrammes: true,
      neverGenerateAffiliateContent: true,
      neverLaunchBusinessesAutomatically: true,
      neverFabricateWorkerStatus: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ802OrLater: true,
    };
  }
}

export function createAffiliateFactoryCore(
  bootstrap: EmpireBootstrapContext,
  options?: AffiliateFactoryCoreOptions,
) {
  return new AffiliateFactoryCore(bootstrap, options);
}

export function resetAffiliateFactoryCoreForTesting() {
  resetAfcLogsForTesting();
  resetProjectSequenceForTesting();
}
