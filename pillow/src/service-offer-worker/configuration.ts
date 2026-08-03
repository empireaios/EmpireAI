import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  PACKAGE_TYPES,
  SERVICE_OFFER_WORKER_IDENTITY,
  SOW_METADATA_VERSION,
} from "./paths.js";
import type { PackageType, ServiceOfferReport } from "./types.js";

export type ServiceOfferWorkerConfiguration = {
  enabled: boolean;
  offerRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  packageTypes: PackageType[];
  seedReports: ServiceOfferReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q7-03 hard boundaries — force-locked true. */
  neverBuildBookingSystems: true;
  neverBuildCrm: true;
  neverExecuteCustomerJobs: true;
  neverLaunchBusiness: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricatePricingEvidence: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ704OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_SERVICE_OFFER_WORKER_CONFIGURATION: ServiceOfferWorkerConfiguration = {
  enabled: true,
  offerRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: SERVICE_OFFER_WORKER_IDENTITY.workerId,
  workerName: SERVICE_OFFER_WORKER_IDENTITY.workerName,
  factory: SERVICE_OFFER_WORKER_IDENTITY.factory,
  department: SERVICE_OFFER_WORKER_IDENTITY.department,
  role: SERVICE_OFFER_WORKER_IDENTITY.role,
  reportingLine: [...SERVICE_OFFER_WORKER_IDENTITY.reportingLine],
  packageTypes: [...PACKAGE_TYPES],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverBuildBookingSystems: true,
  neverBuildCrm: true,
  neverExecuteCustomerJobs: true,
  neverLaunchBusiness: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverFabricatePricingEvidence: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ704OrLater: true,
  preserveCompleteTraceability: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildServiceOfferWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ServiceOfferWorkerConfiguration> = {},
): ServiceOfferWorkerConfiguration {
  let file: Partial<ServiceOfferWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "service-offer-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.SERVICE_OFFER_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.SERVICE_OFFER_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "integrationTargets" | "packageTypes") =>
    Array.from(
      new Set([
        ...DEFAULT_SERVICE_OFFER_WORKER_CONFIGURATION[key],
        ...((file[key] as string[] | undefined) ?? []),
        ...((overrides[key] as string[] | undefined) ?? []),
      ]),
    );

  return {
    ...DEFAULT_SERVICE_OFFER_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    packageTypes: mergeList("packageTypes") as PackageType[],
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_SERVICE_OFFER_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) =>
      lockReport(report),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverBuildBookingSystems: true,
    neverBuildCrm: true,
    neverExecuteCustomerJobs: true,
    neverLaunchBusiness: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricatePricingEvidence: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ704OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: ServiceOfferReport): ServiceOfferReport {
  return {
    ...report,
    serviceCatalogue: report.serviceCatalogue.map((s) => ({
      ...s,
      targetSegments: [...s.targetSegments],
      sourceResearchRefs: [...s.sourceResearchRefs],
    })),
    servicePackages: report.servicePackages.map((p) => ({
      ...p,
      pricingAssumptions: [...p.pricingAssumptions],
      optionalExtras: [...p.optionalExtras],
      renewalOptions: [...p.renewalOptions],
      inclusions: [...p.inclusions],
      exclusions: [...p.exclusions],
      sourceResearchRefs: [...p.sourceResearchRefs],
      recommendedPrice: { ...p.recommendedPrice },
      estimatedOperationalCost: { ...p.estimatedOperationalCost },
      estimatedGrossMargin: { ...p.estimatedGrossMargin },
    })),
    pricingRecommendations: report.pricingRecommendations.map((r) => ({
      ...r,
      pricingAssumptions: [...r.pricingAssumptions],
      recommendedPrice: { ...r.recommendedPrice },
      referencesQ702PricingFindings: true,
    })),
    packageInclusions: report.packageInclusions.map((p) => ({
      ...p,
      inclusions: [...p.inclusions],
    })),
    packageExclusions: report.packageExclusions.map((p) => ({
      ...p,
      exclusions: [...p.exclusions],
    })),
    guarantees: report.guarantees.map((g) => ({ ...g })),
    fulfilmentRequirements: report.fulfilmentRequirements.map((f) => ({
      ...f,
      skills: [...f.skills],
      equipment: [...f.equipment],
      materials: [...f.materials],
      licences: [...f.licences],
      workflowPrerequisites: [...f.workflowPrerequisites],
      customerPreparation: [...f.customerPreparation],
      completionCriteria: [...f.completionCriteria],
    })),
    operationalAssumptions: [...report.operationalAssumptions],
    risks: [...report.risks],
    outstandingQuestions: [...report.outstandingQuestions],
    evidenceAssumptionNotes: [...report.evidenceAssumptionNotes],
    traceabilityRefs: [...report.traceabilityRefs],
    metadataVersion: report.metadataVersion || SOW_METADATA_VERSION,
    consumableByQ704: true,
    neverBuildBookingSystems: true,
    neverBuildCrm: true,
    neverExecuteCustomerJobs: true,
    neverLaunchBusiness: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricatePricingEvidence: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ704OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
