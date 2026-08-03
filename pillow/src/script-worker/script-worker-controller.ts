import type { ScriptWorkerConfiguration } from "./configuration.js";
import type { ScriptWorkerDependencies } from "./integrations.js";
import { ScriptManager } from "./script-manager.js";
import type {
  EngineStatus,
  ScriptWorkerInput,
  ScriptWorkerRunReport,
} from "./types.js";

export class ScriptWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: ScriptWorkerRunReport | null = null;

  constructor(
    private readonly manager: ScriptManager,
    private readonly config: ScriptWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ScriptWorkerDependencies = {}) {
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
      supportedContentFormats: [...this.config.supportedContentFormats],
      reportingLine: [...this.config.reportingLine],
      seedScripts: this.config.seedScripts.map((script) => ({
        ...script,
        scriptSections: script.scriptSections.map((s) => ({ ...s })),
        traceabilityRefs: [...script.traceabilityRefs],
        preservedDecisions: script.preservedDecisions.map((d) => ({ ...d })),
        selfReviewFindings: script.selfReviewFindings.map((f) => ({ ...f })),
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

  receiveApprovedTopicPlan(input: ScriptWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedTopicPlan(input, this.config));
  }

  receiveEditorialStrategy(input: ScriptWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveEditorialStrategy(input, this.config));
  }

  determineContentFormat(input: ScriptWorkerInput = {}) {
    this.status = "formatting";
    return this.finish(this.manager.determineContentFormat(input, this.config));
  }

  generateCompleteScript(input: ScriptWorkerInput = {}) {
    this.status = "writing";
    return this.finish(this.manager.generateCompleteScript(input, this.config));
  }

  adaptWritingStyle(input: ScriptWorkerInput = {}) {
    this.status = "writing";
    return this.finish(this.manager.adaptWritingStyle(input, this.config));
  }

  structureScriptSections(input: ScriptWorkerInput = {}) {
    this.status = "writing";
    return this.finish(this.manager.structureScriptSections(input, this.config));
  }

  generateNarrationReadyOutput(input: ScriptWorkerInput = {}) {
    this.status = "writing";
    return this.finish(this.manager.generateNarrationReadyOutput(input, this.config));
  }

  selfReviewScript(input: ScriptWorkerInput = {}) {
    this.status = "reviewing";
    return this.finish(this.manager.selfReviewScript(input, this.config));
  }

  produceScriptReport(input: ScriptWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceScriptReport(input, this.config));
  }

  submitReport(input: ScriptWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: ScriptWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ScriptWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
