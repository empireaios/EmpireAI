import type { ExecutiveReportingRuntimeConfiguration } from "./configuration.js";
import { ExecutiveReportingRuntimeCore } from "./executive-reporting-runtime-core.js";
import type {
  EngineStatus,
  ExecutiveReportingRuntimeInput,
  ExecutiveReportingRuntimeRunReport,
} from "./types.js";

export class ExecutiveReportingRuntimeController {
  private status: EngineStatus = "idle";
  private latestReport: ExecutiveReportingRuntimeRunReport | null = null;

  constructor(
    private readonly manager: ExecutiveReportingRuntimeCore,
    private readonly config: ExecutiveReportingRuntimeConfiguration,
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
      reportTypes: [...this.config.reportTypes],
      entityTypes: [...this.config.entityTypes],
      reportingFrequencies: [...this.config.reportingFrequencies],
      seedReports: this.config.seedReports.map((r) => ({
        ...r,
        blockers: [...r.blockers],
        risks: [...r.risks],
        evidence: [...r.evidence],
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

  submitWorker(input: ExecutiveReportingRuntimeInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.submitWorker(input, this.config));
  }

  submitDepartment(input: ExecutiveReportingRuntimeInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.submitDepartment(input, this.config));
  }

  submitFactory(input: ExecutiveReportingRuntimeInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.submitFactory(input, this.config));
  }

  submitExecutive(input: ExecutiveReportingRuntimeInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.submitExecutive(input, this.config));
  }

  aggregateProgress(input: ExecutiveReportingRuntimeInput = {}) {
    this.status = "aggregating";
    return this.finish(this.manager.aggregateProgress(input, this.config));
  }

  listBlockers(input: ExecutiveReportingRuntimeInput = {}) {
    this.status = "aggregating";
    return this.finish(this.manager.listBlockers(input, this.config));
  }

  generateSummary(input: ExecutiveReportingRuntimeInput = {}) {
    this.status = "summarizing";
    return this.finish(this.manager.generateSummary(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: ExecutiveReportingRuntimeInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ExecutiveReportingRuntimeRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
