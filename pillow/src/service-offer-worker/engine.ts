import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildServiceOfferWorkerConfiguration,
  type ServiceOfferWorkerConfiguration,
} from "./configuration.js";
import type { ServiceOfferWorkerDependencies } from "./integrations.js";
import { resetOfferSequenceForTesting } from "./offer-builder.js";
import { OfferManager } from "./offer-manager.js";
import { SERVICE_OFFER_WORKER_SYSTEM_PATH } from "./paths.js";
import { ServiceOfferWorkerController } from "./service-offer-worker-controller.js";
import { resetSowLogsForTesting } from "./sow-logging.js";
import type {
  Q704ConsumableContract,
  ServiceOfferInput,
  ServiceOfferWorkerCockpitSnapshot,
  ServiceOfferWorkerState,
} from "./types.js";

export interface ServiceOfferWorkerOptions {
  configuration?: Partial<ServiceOfferWorkerConfiguration>;
  dependencies?: ServiceOfferWorkerDependencies;
}

/** Authoritative Q7-03 Service Offer Worker — structural service-offer signals only. */
export class ServiceOfferWorker {
  private initializedAt: string | null = null;
  private readonly controller: ServiceOfferWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ServiceOfferWorkerOptions = {},
  ) {
    const manager = new OfferManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new ServiceOfferWorkerController(
      manager,
      buildServiceOfferWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      SERVICE_OFFER_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Service Offer Worker")) {
      throw new Error(
        `${SERVICE_OFFER_WORKER_SYSTEM_PATH} missing — Q7-03 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ServiceOfferWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ServiceOfferWorkerState {
    if (!this.initializedAt) {
      throw new Error("Service Offer Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-SOW-001",
      missionId: "Q7-03",
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
        totalReports: engineRecord?.totalReports ?? 0,
        totalSessions: engineRecord?.totalSessions ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Service Offer Worker produces structural service offer packages only: does not build booking systems or CRM, execute customer jobs, launch businesses, fabricate pricing evidence, override approved architecture, override Pillow or Grand King, or implement Q7-04 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  consumeMarketResearch(input: ServiceOfferInput = {}) {
    return this.controller.consumeMarketResearch(input);
  }

  defineServiceCatalogue(input: ServiceOfferInput = {}) {
    return this.controller.defineServiceCatalogue(input);
  }

  defineServicePackages(input: ServiceOfferInput = {}) {
    return this.controller.defineServicePackages(input);
  }

  recommendPricingStructure(input: ServiceOfferInput = {}) {
    return this.controller.recommendPricingStructure(input);
  }

  definePackageInclusions(input: ServiceOfferInput = {}) {
    return this.controller.definePackageInclusions(input);
  }

  definePackageExclusions(input: ServiceOfferInput = {}) {
    return this.controller.definePackageExclusions(input);
  }

  defineGuarantees(input: ServiceOfferInput = {}) {
    return this.controller.defineGuarantees(input);
  }

  defineFulfilmentRequirements(input: ServiceOfferInput = {}) {
    return this.controller.defineFulfilmentRequirements(input);
  }

  defineRequiredResources(input: ServiceOfferInput = {}) {
    return this.controller.defineRequiredResources(input);
  }

  produceServiceOfferReport(input: ServiceOfferInput = {}) {
    return this.controller.produceServiceOfferReport(input);
  }

  produceReport(input: ServiceOfferInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: ServiceOfferInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  validate(input: ServiceOfferInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestReportId() {
    return this.controller.getManager().getLatestReportId();
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
        `Service offer reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ServiceOfferWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q7-03",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalSessions: state.health.totalSessions,
      latestReportId: this.getLatestReportId(),
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverBuildBookingSystems: true,
      neverBuildCrm: true,
      neverExecuteCustomerJobs: true,
      neverLaunchBusiness: true,
      neverFabricatePricingEvidence: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ704OrLater: true,
      consumableByQ704: true,
    };
  }

  getQ704ConsumableContract(): Q704ConsumableContract {
    return {
      contractVersion: "SOW-Q704-v1",
      consumableByQ704: true,
      fields: [
        "reportId",
        "businessProjectId",
        "sourceResearchId",
        "serviceCatalogue",
        "servicePackages",
        "pricingRecommendations",
        "packageInclusions",
        "packageExclusions",
        "guarantees",
        "fulfilmentRequirements",
        "operationalAssumptions",
        "risks",
        "outstandingQuestions",
        "confidenceScore",
        "executiveSummary",
        "traceabilityRefs",
      ] as const,
      types: {
        ServiceOfferReport: "ServiceOfferReport",
        ServiceCatalogueItem: "ServiceCatalogueItem",
        ServicePackage: "ServicePackage",
        PricingRecommendation: "PricingRecommendation",
        Guarantee: "Guarantee",
        FulfilmentRequirement: "FulfilmentRequirement",
      },
      notes: [
        "Q7-04 may consume structural service offer packages only.",
        "Pricing recommendations always reference Q7-02 pricing findings; never fabricated.",
        "SOW never builds booking systems, CRM, executes jobs, or launches businesses.",
      ],
      neverBuildBookingSystems: true,
      neverBuildCrm: true,
      neverExecuteCustomerJobs: true,
      neverLaunchBusiness: true,
      neverFabricatePricingEvidence: true,
    };
  }
}

export function createServiceOfferWorker(
  bootstrap: EmpireBootstrapContext,
  options?: ServiceOfferWorkerOptions,
) {
  return new ServiceOfferWorker(bootstrap, options);
}

export function resetServiceOfferWorkerForTesting() {
  resetSowLogsForTesting();
  resetOfferSequenceForTesting();
}
