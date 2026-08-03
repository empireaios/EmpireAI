import type { TemplateBuilderWorkerConfiguration } from "./configuration.js";
import type { TemplateBuilderWorkerDependencies } from "./integrations.js";
import { TemplateManager } from "./template-manager.js";
import type {
  EngineStatus,
  TemplateBuilderWorkerInput,
  TemplateBuilderWorkerRunReport,
} from "./types.js";

export class TemplateBuilderWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: TemplateBuilderWorkerRunReport | null = null;

  constructor(
    private readonly manager: TemplateManager,
    private readonly config: TemplateBuilderWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: TemplateBuilderWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      integrationTargets: [...this.config.integrationTargets],
      supportedProductTypes: [...this.config.supportedProductTypes],
      reportingLine: [...this.config.reportingLine],
      seedTemplateProducts: this.config.seedTemplateProducts.map((product) => ({
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
      })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  receiveApprovedDigitalProductResearch(input: TemplateBuilderWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(
      this.manager.receiveApprovedDigitalProductResearch(input, this.config),
    );
  }

  generateReusableTemplates(input: TemplateBuilderWorkerInput = {}) {
    this.status = "generating_templates";
    return this.finish(this.manager.generateReusableTemplates(input, this.config));
  }

  generatePlanners(input: TemplateBuilderWorkerInput = {}) {
    this.status = "generating_planners";
    return this.finish(this.manager.generatePlanners(input, this.config));
  }

  generateSpreadsheets(input: TemplateBuilderWorkerInput = {}) {
    this.status = "generating_spreadsheets";
    return this.finish(this.manager.generateSpreadsheets(input, this.config));
  }

  generateContractsAndDocumentTemplates(input: TemplateBuilderWorkerInput = {}) {
    this.status = "generating_contracts";
    return this.finish(this.manager.generateContractsAndDocumentTemplates(input, this.config));
  }

  generateBusinessFormsAndChecklists(input: TemplateBuilderWorkerInput = {}) {
    this.status = "generating_forms";
    return this.finish(this.manager.generateBusinessFormsAndChecklists(input, this.config));
  }

  generateReusablePromptLibraries(input: TemplateBuilderWorkerInput = {}) {
    this.status = "generating_prompts";
    return this.finish(this.manager.generateReusablePromptLibraries(input, this.config));
  }

  validateUsabilityAndCompleteness(input: TemplateBuilderWorkerInput = {}) {
    this.status = "validating_usability";
    return this.finish(this.manager.validateUsabilityAndCompleteness(input, this.config));
  }

  prepareExportReadyTemplatePackages(input: TemplateBuilderWorkerInput = {}) {
    this.status = "exporting";
    return this.finish(this.manager.prepareExportReadyTemplatePackages(input, this.config));
  }

  produceTemplateBuilderReport(input: TemplateBuilderWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceTemplateBuilderReport(input, this.config));
  }

  submitReport(input: TemplateBuilderWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: TemplateBuilderWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: TemplateBuilderWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
