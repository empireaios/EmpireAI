import type { PromptProductWorkerConfiguration } from "./configuration.js";
import type { PromptProductWorkerDependencies } from "./integrations.js";
import { PromptManager } from "./prompt-manager.js";
import type {
  EngineStatus,
  PromptProductWorkerInput,
  PromptProductWorkerRunReport,
} from "./types.js";

export class PromptProductWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: PromptProductWorkerRunReport | null = null;

  constructor(
    private readonly manager: PromptManager,
    private readonly config: PromptProductWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: PromptProductWorkerDependencies = {}) {
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
      supportedTargetAiPlatforms: [...this.config.supportedTargetAiPlatforms],
      reportingLine: [...this.config.reportingLine],
      seedPromptProducts: this.config.seedPromptProducts.map((product) => ({
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

  receiveApprovedDigitalProductResearch(input: PromptProductWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(
      this.manager.receiveApprovedDigitalProductResearch(input, this.config),
    );
  }

  designPromptArchitecture(input: PromptProductWorkerInput = {}) {
    this.status = "architecting";
    return this.finish(this.manager.designPromptArchitecture(input, this.config));
  }

  createPromptLibraries(input: PromptProductWorkerInput = {}) {
    this.status = "library_building";
    return this.finish(this.manager.createPromptLibraries(input, this.config));
  }

  createReusablePromptTemplates(input: PromptProductWorkerInput = {}) {
    this.status = "templating";
    return this.finish(this.manager.createReusablePromptTemplates(input, this.config));
  }

  createAiWorkflowProducts(input: PromptProductWorkerInput = {}) {
    this.status = "workflow_building";
    return this.finish(this.manager.createAiWorkflowProducts(input, this.config));
  }

  organizePromptsIntoStructuredPacks(input: PromptProductWorkerInput = {}) {
    this.status = "packing";
    return this.finish(this.manager.organizePromptsIntoStructuredPacks(input, this.config));
  }

  generateUserInstructions(input: PromptProductWorkerInput = {}) {
    this.status = "instructing";
    return this.finish(this.manager.generateUserInstructions(input, this.config));
  }

  validatePromptConsistency(input: PromptProductWorkerInput = {}) {
    this.status = "validating_prompts";
    return this.finish(this.manager.validatePromptConsistency(input, this.config));
  }

  packageExportReadyPromptProducts(input: PromptProductWorkerInput = {}) {
    this.status = "exporting";
    return this.finish(this.manager.packageExportReadyPromptProducts(input, this.config));
  }

  producePromptProductReport(input: PromptProductWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.producePromptProductReport(input, this.config));
  }

  submitReport(input: PromptProductWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: PromptProductWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: PromptProductWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
