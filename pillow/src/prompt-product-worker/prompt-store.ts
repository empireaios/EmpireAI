import type { PromptProductReport } from "./types.js";

/** Authoritative in-memory prompt product store — creation/export-ready assets only. */
export class PromptStore {
  private products = new Map<string, PromptProductReport>();
  private latestPromptProductId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    promptProductId: string;
    action: string;
    details: string;
  }> = [];

  seed(products: PromptProductReport[]) {
    this.products.clear();
    this.latestPromptProductId = null;
    this.auditTrail = [];
    for (const product of products) {
      this.products.set(product.promptProductId, clone(product));
      this.latestPromptProductId = product.promptProductId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        promptProductId: product.promptProductId,
        action: "seed",
        details: `seeded promptProduct=${product.promptProductId} title=${product.productTitle} type=${product.productType}`,
      });
    }
  }

  count() {
    return this.products.size;
  }

  list() {
    return [...this.products.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(promptProductId: string) {
    const product = this.products.get(promptProductId);
    return product ? clone(product) : null;
  }

  getLatestPromptProductId() {
    return this.latestPromptProductId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(product: PromptProductReport, action = "save") {
    this.products.set(product.promptProductId, clone(product));
    this.latestPromptProductId = product.promptProductId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      promptProductId: product.promptProductId,
      action,
      details: `title=${product.productTitle} type=${product.productType} prompts=${product.promptLibrary.length} confidence=${product.confidenceScore}`,
    });
    return clone(product);
  }

  markSubmitted(promptProductId: string, executiveReportId: string) {
    const current = this.products.get(promptProductId);
    if (!current) return null;
    const updated: PromptProductReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(product: PromptProductReport): PromptProductReport {
  return {
    ...product,
    targetAiPlatforms: [...product.targetAiPlatforms],
    promptCategories: [...product.promptCategories],
    promptLibrary: product.promptLibrary.map((p) => ({
      ...p,
      variables: p.variables ? [...p.variables] : undefined,
      platformHints: p.platformHints ? [...p.platformHints] : undefined,
    })),
    workflowComponents: product.workflowComponents.map((w) => ({ ...w })),
    exportFormats: [...product.exportFormats],
    structuredPacks: product.structuredPacks.map((s) => ({
      ...s,
      promptIds: [...s.promptIds],
    })),
    promptArchitecture: product.promptArchitecture
      ? {
          ...product.promptArchitecture,
          layers: [...product.promptArchitecture.layers],
          categories: [...product.promptArchitecture.categories],
          designPrinciples: [...product.promptArchitecture.designPrinciples],
        }
      : null,
    selfReviewFindings: product.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...product.traceabilityRefs],
    preservedDecisions: product.preservedDecisions.map((d) => ({ ...d })),
  };
}
