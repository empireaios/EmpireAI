import type { WorkerQualityStandardConfiguration } from "./configuration.js";
import { WorkerQualityStandardCore } from "./worker-quality-standard-core.js";
import type {
  EngineStatus,
  WorkerQualityStandardInput,
  WorkerQualityStandardRunReport,
} from "./types.js";

export class WorkerQualityStandardController {
  private status: EngineStatus = "idle";
  private latestReport: WorkerQualityStandardRunReport | null = null;

  constructor(
    private readonly manager: WorkerQualityStandardCore,
    private readonly config: WorkerQualityStandardConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
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
      qualityStandards: [...this.config.qualityStandards],
      seedQualityRecords: this.config.seedQualityRecords.map((r) => ({
        ...r,
        evidence: [...r.evidence],
        assumptions: [...r.assumptions],
        limitations: [...r.limitations],
        standardsChecked: [...r.standardsChecked],
        standardsSatisfied: [...r.standardsSatisfied],
        standardsFailed: [...r.standardsFailed],
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

  validateWorker(input: WorkerQualityStandardInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateWorker(input, this.config));
  }

  scoreConfidence(input: WorkerQualityStandardInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.scoreConfidence(input, this.config));
  }

  recordEvidence(input: WorkerQualityStandardInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.recordEvidence(input, this.config));
  }

  recordAssumptions(input: WorkerQualityStandardInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.recordAssumptions(input, this.config));
  }

  reportLimitations(input: WorkerQualityStandardInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.reportLimitations(input, this.config));
  }

  checkGovernance(input: WorkerQualityStandardInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.checkGovernance(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: WorkerQualityStandardInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkerQualityStandardRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
