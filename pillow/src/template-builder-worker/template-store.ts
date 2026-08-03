import type { TemplateBuilderReport } from "./types.js";

/** Authoritative in-memory template product store — creation/export-ready assets only. */
export class TemplateStore {
  private products = new Map<string, TemplateBuilderReport>();
  private latestTemplateProductId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    templateProductId: string;
    action: string;
    details: string;
  }> = [];

  seed(products: TemplateBuilderReport[]) {
    this.products.clear();
    this.latestTemplateProductId = null;
    this.auditTrail = [];
    for (const product of products) {
      this.products.set(product.templateProductId, clone(product));
      this.latestTemplateProductId = product.templateProductId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        templateProductId: product.templateProductId,
        action: "seed",
        details: `seeded templateProduct=${product.templateProductId} title=${product.productTitle} type=${product.productType}`,
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

  get(templateProductId: string) {
    const product = this.products.get(templateProductId);
    return product ? clone(product) : null;
  }

  getLatestTemplateProductId() {
    return this.latestTemplateProductId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(product: TemplateBuilderReport, action = "save") {
    this.products.set(product.templateProductId, clone(product));
    this.latestTemplateProductId = product.templateProductId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      templateProductId: product.templateProductId,
      action,
      details: `title=${product.productTitle} type=${product.productType} templates=${product.templates.length} confidence=${product.confidenceScore}`,
    });
    return clone(product);
  }

  markSubmitted(templateProductId: string, executiveReportId: string) {
    const current = this.products.get(templateProductId);
    if (!current) return null;
    const updated: TemplateBuilderReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(product: TemplateBuilderReport): TemplateBuilderReport {
  return {
    ...product,
    templateTypes: [...product.templateTypes],
    includedAssets: [...product.includedAssets],
    supportedFormats: [...product.supportedFormats],
    exportFormats: [...product.exportFormats],
    templates: product.templates.map((t) => ({
      ...t,
      sections: t.sections ? t.sections.map((s) => ({ ...s })) : undefined,
    })),
    planners: product.planners.map((p) => ({
      ...p,
      weeks: p.weeks.map((w) => ({
        ...w,
        tasks: w.tasks.map((task) => ({ ...task })),
      })),
    })),
    spreadsheets: product.spreadsheets.map((s) => ({
      ...s,
      columns: [...s.columns],
      rows: s.rows.map((r) => ({ ...r })),
    })),
    contracts: product.contracts.map((c) => ({
      ...c,
      clauses: c.clauses.map((clause) => ({ ...clause })),
    })),
    forms: product.forms.map((f) => ({
      ...f,
      fields: f.fields.map((field) => ({ ...field })),
    })),
    checklists: product.checklists.map((c) => ({
      ...c,
      items: c.items.map((item) => ({ ...item })),
    })),
    promptLibrary: product.promptLibrary.map((p) => ({ ...p })),
    selfReviewFindings: product.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...product.traceabilityRefs],
    preservedDecisions: product.preservedDecisions.map((d) => ({ ...d })),
  };
}
