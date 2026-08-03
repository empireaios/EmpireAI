import type { CheckoutReport } from "./types.js";

/** Authoritative in-memory checkout store — structural preparation only. */
export class CheckoutStore {
  private checkouts = new Map<string, CheckoutReport>();
  private latestCheckoutId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    checkoutId: string;
    action: string;
    details: string;
  }> = [];

  seed(checkouts: CheckoutReport[]) {
    this.checkouts.clear();
    this.latestCheckoutId = null;
    this.auditTrail = [];
    for (const checkout of checkouts) {
      this.checkouts.set(checkout.checkoutId, clone(checkout));
      this.latestCheckoutId = checkout.checkoutId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        checkoutId: checkout.checkoutId,
        action: "seed",
        details: `seeded checkout=${checkout.checkoutId} title=${checkout.productTitle} flow=${checkout.checkoutFlowType}`,
      });
    }
  }

  count() {
    return this.checkouts.size;
  }

  list() {
    return [...this.checkouts.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(checkoutId: string) {
    const checkout = this.checkouts.get(checkoutId);
    return checkout ? clone(checkout) : null;
  }

  getLatestCheckoutId() {
    return this.latestCheckoutId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(checkout: CheckoutReport, action = "save") {
    this.checkouts.set(checkout.checkoutId, clone(checkout));
    this.latestCheckoutId = checkout.checkoutId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      checkoutId: checkout.checkoutId,
      action,
      details: `title=${checkout.productTitle} flow=${checkout.checkoutFlowType} steps=${checkout.checkoutFlow.steps.length} confidence=${checkout.confidenceScore}`,
    });
    return clone(checkout);
  }

  markSubmitted(checkoutId: string, executiveReportId: string) {
    const current = this.checkouts.get(checkoutId);
    if (!current) return null;
    const updated: CheckoutReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(report: CheckoutReport): CheckoutReport {
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
  };
}
