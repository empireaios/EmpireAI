import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CHECKOUT_FLOW_TYPES,
  CHECKOUT_WORKER_IDENTITY,
  CKW_METADATA_VERSION,
  FEATURES,
  INTEGRATION_TARGETS,
  PAYMENT_PROVIDERS,
  PRODUCT_TYPES,
} from "./paths.js";
import type { CheckoutReport } from "./types.js";

export type CheckoutWorkerConfiguration = {
  enabled: boolean;
  checkoutRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultCheckoutFlow: string;
  defaultCurrency: string;
  defaultProductType: string;
  supportedCheckoutFlows: string[];
  supportedProductTypes: string[];
  supportedPaymentProviders: string[];
  supportedFeatures: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedCheckouts: CheckoutReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q5-09 hard boundaries — force-locked true. */
  neverChargeCustomers: true;
  neverExecutePaymentTransactions: true;
  neverDeliverProducts: true;
  neverPublishStorefronts: true;
  neverStoreSensitivePaymentCredentials: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ510OrLater: true;
  followApprovedProductInformation: true;
  preserveCompleteTraceability: true;
  validateCheckoutIntegrityBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_CHECKOUT_WORKER_CONFIGURATION: CheckoutWorkerConfiguration = {
  enabled: true,
  checkoutRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultCheckoutFlow: "one_time_purchase",
  defaultCurrency: "USD",
  defaultProductType: "one_time_purchase",
  supportedCheckoutFlows: [...CHECKOUT_FLOW_TYPES],
  supportedProductTypes: [...PRODUCT_TYPES],
  supportedPaymentProviders: [...PAYMENT_PROVIDERS],
  supportedFeatures: [...FEATURES],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: CHECKOUT_WORKER_IDENTITY.workerId,
  workerName: CHECKOUT_WORKER_IDENTITY.workerName,
  factory: CHECKOUT_WORKER_IDENTITY.factory,
  department: CHECKOUT_WORKER_IDENTITY.department,
  role: CHECKOUT_WORKER_IDENTITY.role,
  reportingLine: [...CHECKOUT_WORKER_IDENTITY.reportingLine],
  seedCheckouts: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverChargeCustomers: true,
  neverExecutePaymentTransactions: true,
  neverDeliverProducts: true,
  neverPublishStorefronts: true,
  neverStoreSensitivePaymentCredentials: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ510OrLater: true,
  followApprovedProductInformation: true,
  preserveCompleteTraceability: true,
  validateCheckoutIntegrityBeforeSubmission: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildCheckoutWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CheckoutWorkerConfiguration> = {},
): CheckoutWorkerConfiguration {
  let file: Partial<CheckoutWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "checkout-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.CHECKOUT_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.CHECKOUT_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (
    key:
      | "integrationTargets"
      | "supportedCheckoutFlows"
      | "supportedProductTypes"
      | "supportedPaymentProviders"
      | "supportedFeatures",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_CHECKOUT_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_CHECKOUT_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedCheckoutFlows: mergeList("supportedCheckoutFlows"),
    supportedProductTypes: mergeList("supportedProductTypes"),
    supportedPaymentProviders: mergeList("supportedPaymentProviders"),
    supportedFeatures: mergeList("supportedFeatures"),
    defaultCheckoutFlow:
      overrides.defaultCheckoutFlow ??
      file.defaultCheckoutFlow ??
      DEFAULT_CHECKOUT_WORKER_CONFIGURATION.defaultCheckoutFlow,
    defaultCurrency:
      overrides.defaultCurrency ??
      file.defaultCurrency ??
      DEFAULT_CHECKOUT_WORKER_CONFIGURATION.defaultCurrency,
    defaultProductType:
      overrides.defaultProductType ??
      file.defaultProductType ??
      DEFAULT_CHECKOUT_WORKER_CONFIGURATION.defaultProductType,
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_CHECKOUT_WORKER_CONFIGURATION.reportingLine),
    ],
    seedCheckouts: (overrides.seedCheckouts ?? file.seedCheckouts ?? []).map((r) =>
      lockCheckoutReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverChargeCustomers: true,
    neverExecutePaymentTransactions: true,
    neverDeliverProducts: true,
    neverPublishStorefronts: true,
    neverStoreSensitivePaymentCredentials: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ510OrLater: true,
    followApprovedProductInformation: true,
    preserveCompleteTraceability: true,
    validateCheckoutIntegrityBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockCheckoutReport(report: CheckoutReport): CheckoutReport {
  return {
    ...report,
    checkoutFlow: {
      ...report.checkoutFlow,
      steps: report.checkoutFlow.steps.map((s) => ({ ...s })),
    },
    paymentProviderConfiguration: report.paymentProviderConfiguration
      ? {
          ...report.paymentProviderConfiguration,
          supportedMethods: [...report.paymentProviderConfiguration.supportedMethods],
          apiKeyPresent: false as const,
          secretsPresent: false as const,
        }
      : null,
    orderSummary: report.orderSummary
      ? {
          ...report.orderSummary,
          lineItems: report.orderSummary.lineItems.map((l) => ({ ...l })),
        }
      : null,
    customerInformationRequirements: [...report.customerInformationRequirements],
    validationResults: {
      ...report.validationResults,
      errors: [...report.validationResults.errors],
      warnings: [...report.validationResults.warnings],
    },
    checkoutFlowSteps: report.checkoutFlowSteps.map((s) => ({ ...s })),
    supportedProviders: [...report.supportedProviders],
    supportedFeatures: [...report.supportedFeatures],
    confirmationWorkflow: report.confirmationWorkflow
      ? {
          ...report.confirmationWorkflow,
          steps: report.confirmationWorkflow.steps.map((s) => ({ ...s })),
        }
      : null,
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || CKW_METADATA_VERSION,
    handoffTarget: "digital-delivery-worker",
    handoffTargetWorkerId: "wkr-digital-delivery-01",
    neverChargeCustomers: true,
    neverExecutePaymentTransactions: true,
    neverDeliverProducts: true,
    neverPublishStorefronts: true,
    neverStoreSensitivePaymentCredentials: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ510OrLater: true,
    followApprovedProductInformation: true,
    preserveCompleteTraceability: true,
    validateCheckoutIntegrityBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
