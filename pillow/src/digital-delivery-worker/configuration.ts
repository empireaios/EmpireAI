import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DELIVERY_METHODS,
  DELIVERY_TYPES,
  DIGITAL_DELIVERY_WORKER_IDENTITY,
  DDW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { DigitalDeliveryReport } from "./types.js";

export type DigitalDeliveryWorkerConfiguration = {
  enabled: boolean;
  deliveryRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultDeliveryType: string;
  defaultDeliveryMethod: string;
  supportedDeliveryTypes: string[];
  supportedDeliveryMethods: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedDeliveries: DigitalDeliveryReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q5-10 hard boundaries — force-locked true. */
  neverProcessPayments: true;
  neverCreateProducts: true;
  neverPublishStorefronts: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ511OrLater: true;
  neverExposeUnauthorizedAccess: true;
  deliverOnlyVerifiedPurchases: true;
  protectCustomerAccess: true;
  preserveCompleteFulfilmentTraceability: true;
  validateSuccessfulDelivery: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverBypassPillowGovernance: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_DIGITAL_DELIVERY_WORKER_CONFIGURATION: DigitalDeliveryWorkerConfiguration = {
  enabled: true,
  deliveryRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultDeliveryType: "secure_file_download",
  defaultDeliveryMethod: "secure_file_download",
  supportedDeliveryTypes: [...DELIVERY_TYPES],
  supportedDeliveryMethods: [...DELIVERY_METHODS],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: DIGITAL_DELIVERY_WORKER_IDENTITY.workerId,
  workerName: DIGITAL_DELIVERY_WORKER_IDENTITY.workerName,
  factory: DIGITAL_DELIVERY_WORKER_IDENTITY.factory,
  department: DIGITAL_DELIVERY_WORKER_IDENTITY.department,
  role: DIGITAL_DELIVERY_WORKER_IDENTITY.role,
  reportingLine: [...DIGITAL_DELIVERY_WORKER_IDENTITY.reportingLine],
  seedDeliveries: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverProcessPayments: true,
  neverCreateProducts: true,
  neverPublishStorefronts: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ511OrLater: true,
  neverExposeUnauthorizedAccess: true,
  deliverOnlyVerifiedPurchases: true,
  protectCustomerAccess: true,
  preserveCompleteFulfilmentTraceability: true,
  validateSuccessfulDelivery: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverBypassPillowGovernance: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildDigitalDeliveryWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<DigitalDeliveryWorkerConfiguration> = {},
): DigitalDeliveryWorkerConfiguration {
  let file: Partial<DigitalDeliveryWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "digital-delivery-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.DIGITAL_DELIVERY_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.DIGITAL_DELIVERY_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (
    key: "integrationTargets" | "supportedDeliveryTypes" | "supportedDeliveryMethods",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_DIGITAL_DELIVERY_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_DIGITAL_DELIVERY_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedDeliveryTypes: mergeList("supportedDeliveryTypes"),
    supportedDeliveryMethods: mergeList("supportedDeliveryMethods"),
    defaultDeliveryType:
      overrides.defaultDeliveryType ??
      file.defaultDeliveryType ??
      DEFAULT_DIGITAL_DELIVERY_WORKER_CONFIGURATION.defaultDeliveryType,
    defaultDeliveryMethod:
      overrides.defaultDeliveryMethod ??
      file.defaultDeliveryMethod ??
      DEFAULT_DIGITAL_DELIVERY_WORKER_CONFIGURATION.defaultDeliveryMethod,
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_DIGITAL_DELIVERY_WORKER_CONFIGURATION.reportingLine),
    ],
    seedDeliveries: (overrides.seedDeliveries ?? file.seedDeliveries ?? []).map((r) =>
      lockDeliveryReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverProcessPayments: true,
    neverCreateProducts: true,
    neverPublishStorefronts: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ511OrLater: true,
    neverExposeUnauthorizedAccess: true,
    deliverOnlyVerifiedPurchases: true,
    protectCustomerAccess: true,
    preserveCompleteFulfilmentTraceability: true,
    validateSuccessfulDelivery: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverBypassPillowGovernance: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockDeliveryReport(report: DigitalDeliveryReport): DigitalDeliveryReport {
  return {
    ...report,
    deliveredAssets: report.deliveredAssets.map((a) => ({ ...a })),
    accessGrants: report.accessGrants.map((g) => ({ ...g })),
    deliverySteps: report.deliverySteps.map((s) => ({ ...s })),
    supportedDeliveryMethods: [...report.supportedDeliveryMethods],
    supportedDeliveryTypes: [...report.supportedDeliveryTypes],
    secureDownloadLinks: report.secureDownloadLinks.map((l) => ({
      ...l,
      authorized: true as const,
      tokenPresent: false as const,
    })),
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || DDW_METADATA_VERSION,
    neverProcessPayments: true,
    neverCreateProducts: true,
    neverPublishStorefronts: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ511OrLater: true,
    neverExposeUnauthorizedAccess: true,
    deliverOnlyVerifiedPurchases: true,
    protectCustomerAccess: true,
    preserveCompleteFulfilmentTraceability: true,
    validateSuccessfulDelivery: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
