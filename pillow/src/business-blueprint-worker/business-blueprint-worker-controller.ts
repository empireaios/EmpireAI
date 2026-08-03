import type { BusinessBlueprintWorkerConfiguration } from "./configuration.js";
import type { BusinessBlueprintWorkerDependencies } from "./integrations.js";
import { BlueprintManager } from "./blueprint-manager.js";
import type {
  BusinessBlueprintWorkerInput,
  BusinessBlueprintWorkerRunReport,
  EngineStatus,
} from "./types.js";

export class BusinessBlueprintWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: BusinessBlueprintWorkerRunReport | null = null;

  constructor(
    private readonly manager: BlueprintManager,
    private readonly config: BusinessBlueprintWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: BusinessBlueprintWorkerDependencies = {}) {
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
      businessTypes: [...this.config.businessTypes],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedBlueprints: this.config.seedBlueprints.map((blueprint) => ({
        ...blueprint,
        productsServices: [...blueprint.productsServices],
        customerSegments: [...blueprint.customerSegments],
        requiredIntegrations: [...blueprint.requiredIntegrations],
        requiredAssets: [...blueprint.requiredAssets],
        preservedDecisions: [...blueprint.preservedDecisions],
        traceabilityRefs: [...blueprint.traceabilityRefs],
        operationalWorkflow: blueprint.operationalWorkflow.map((s) => ({
          ...s,
          dependsOn: [...s.dependsOn],
        })),
        requiredWorkers: blueprint.requiredWorkers.map((w) => ({
          ...w,
          skills: [...w.skills],
        })),
        milestones: blueprint.milestones.map((m) => ({
          ...m,
          dependsOn: [...m.dependsOn],
          successCriteria: [...m.successCriteria],
        })),
        dependencies: blueprint.dependencies.map((d) => ({
          ...d,
          blocks: [...d.blocks],
        })),
        businessArchitecture: {
          ...blueprint.businessArchitecture,
          deliveryChannels: [...blueprint.businessArchitecture.deliveryChannels],
          customerProblemsAddressed: [
            ...blueprint.businessArchitecture.customerProblemsAddressed,
          ],
        },
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

  receiveBusinessModel(input: BusinessBlueprintWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveBusinessModel(input, this.config));
  }

  receiveMarketResearch(input: BusinessBlueprintWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveMarketResearch(input, this.config));
  }

  receiveOpportunityEvaluation(input: BusinessBlueprintWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveOpportunityEvaluation(input, this.config));
  }

  consolidate(input: BusinessBlueprintWorkerInput = {}) {
    this.status = "consolidating";
    return this.finish(this.manager.consolidate(input, this.config));
  }

  defineArchitecture(input: BusinessBlueprintWorkerInput = {}) {
    this.status = "blueprinting";
    return this.finish(this.manager.defineArchitecture(input, this.config));
  }

  defineWorkflow(input: BusinessBlueprintWorkerInput = {}) {
    this.status = "blueprinting";
    return this.finish(this.manager.defineWorkflow(input, this.config));
  }

  defineWorkers(input: BusinessBlueprintWorkerInput = {}) {
    this.status = "blueprinting";
    return this.finish(this.manager.defineWorkers(input, this.config));
  }

  defineMilestones(input: BusinessBlueprintWorkerInput = {}) {
    this.status = "blueprinting";
    return this.finish(this.manager.defineMilestones(input, this.config));
  }

  produceBlueprint(input: BusinessBlueprintWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceBlueprint(input, this.config));
  }

  submitBlueprint(input: BusinessBlueprintWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitBlueprint(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: BusinessBlueprintWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: BusinessBlueprintWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
