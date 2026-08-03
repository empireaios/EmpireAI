import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildBusinessRiskWorkerConfiguration,
  type BusinessRiskWorkerConfiguration,
} from "./configuration.js";
import type { BusinessRiskWorkerDependencies } from "./integrations.js";
import { BusinessRiskWorkerController } from "./business-risk-worker-controller.js";
import { resetBrwLogsForTesting } from "./brw-logging.js";
import { BUSINESS_RISK_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetRiskSequenceForTesting } from "./risk-builder.js";
import { RiskManager } from "./risk-manager.js";
import type {
  BusinessRiskWorkerCockpitSnapshot,
  BusinessRiskWorkerInput,
  BusinessRiskWorkerState,
} from "./types.js";

export interface BusinessRiskWorkerOptions {
  configuration?: Partial<BusinessRiskWorkerConfiguration>;
  dependencies?: BusinessRiskWorkerDependencies;
}

/** Authoritative Q2-08 Business Risk Worker — assessment only. */
export class BusinessRiskWorker {
  private initializedAt: string | null = null;
  private readonly controller: BusinessRiskWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: BusinessRiskWorkerOptions = {},
  ) {
    const manager = new RiskManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new BusinessRiskWorkerController(
      manager,
      buildBusinessRiskWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      BUSINESS_RISK_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Business Risk Worker")) {
      throw new Error(
        `${BUSINESS_RISK_WORKER_SYSTEM_PATH} missing — Q2-08 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: BusinessRiskWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): BusinessRiskWorkerState {
    if (!this.initializedAt) {
      throw new Error("Business Risk Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-BRW-001",
      missionId: "Q2-08",
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
        totalRiskReports: engineRecord?.totalRiskReports ?? 0,
        lastRiskReportId: engineRecord?.lastRiskReportId ?? null,
        lastPortfolioRiskRating: engineRecord?.lastPortfolioRiskRating ?? null,
        notes: [
          "Assessment-only: does not remove risks automatically, approve/reject businesses, launch businesses, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectBusinessRiskWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveBusinessBlueprint(input: BusinessRiskWorkerInput = {}) {
    return this.controller.receiveBlueprint(input);
  }

  receiveLaunchPlan(input: BusinessRiskWorkerInput = {}) {
    return this.controller.receiveLaunchPlan(input);
  }

  identifyBusinessRisks(input: BusinessRiskWorkerInput = {}) {
    return this.controller.identifyRisks(input);
  }

  scoreBusinessRisks(input: BusinessRiskWorkerInput = {}) {
    return this.controller.scoreRisks(input);
  }

  recommendMitigations(input: BusinessRiskWorkerInput = {}) {
    return this.controller.recommendMitigations(input);
  }

  produceBusinessRiskReport(input: BusinessRiskWorkerInput = {}) {
    return this.controller.produceRiskReport(input);
  }

  submitBusinessRiskReport(input: BusinessRiskWorkerInput = {}) {
    return this.controller.submitRiskReport(input);
  }

  listBusinessRiskReports() {
    return this.controller.list();
  }

  validateBusinessRiskWorker(input: BusinessRiskWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getRiskReports() {
    return this.controller.getManager().getReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestRiskReportId() {
    return this.controller.getManager().getLatestReportId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
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
        `Risk reports: ${state.health.totalRiskReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): BusinessRiskWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q2-08",
      status: state.status,
      healthStatus: state.health.status,
      totalRiskReports: state.health.totalRiskReports,
      latestRiskReportId: this.getLatestRiskReportId(),
      lastPortfolioRiskRating: state.health.lastPortfolioRiskRating,
      workerId: state.configuration.workerId,
      neverRemoveRisksAutomatically: true,
      neverApproveBusiness: true,
      neverRejectBusiness: true,
      neverLaunchBusiness: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createBusinessRiskWorker(
  bootstrap: EmpireBootstrapContext,
  options?: BusinessRiskWorkerOptions,
) {
  return new BusinessRiskWorker(bootstrap, options);
}

export function resetBusinessRiskWorkerForTesting() {
  resetBrwLogsForTesting();
  resetRiskSequenceForTesting();
}
