import type { DecisionMemoryConfiguration } from "./configuration.js";
import { DecisionMemoryCore } from "./decision-memory-core.js";
import type {
  DecisionMemoryInput,
  DecisionMemoryRunReport,
  EngineStatus,
} from "./types.js";

export class DecisionMemoryController {
  private status: EngineStatus = "idle";
  private latestReport: DecisionMemoryRunReport | null = null;

  constructor(
    private readonly manager: DecisionMemoryCore,
    private readonly config: DecisionMemoryConfiguration,
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
      lookupDimensions: [...this.config.lookupDimensions],
      seedDecisions: this.config.seedDecisions.map((d) => ({
        ...d,
        alternativeOptions: d.alternativeOptions.map((o) => ({ ...o })),
        supportingEvidence: [...d.supportingEvidence],
        assumptions: [...d.assumptions],
        relatedWorkers: [...d.relatedWorkers],
        riskAssessment: {
          ...d.riskAssessment,
          factors: [...d.riskAssessment.factors],
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

  record(input: DecisionMemoryInput = {}) {
    this.status = "recording";
    return this.finish(this.manager.record(input, this.config));
  }

  retrieve(input: DecisionMemoryInput = {}) {
    this.status = "retrieving";
    return this.finish(this.manager.retrieve(input, this.config));
  }

  search(input: DecisionMemoryInput = {}) {
    this.status = "searching";
    return this.finish(this.manager.search(input, this.config));
  }

  compare(input: DecisionMemoryInput = {}) {
    this.status = "comparing";
    return this.finish(this.manager.compare(input, this.config));
  }

  updateOutcome(input: DecisionMemoryInput = {}) {
    this.status = "recording";
    return this.finish(this.manager.updateOutcome(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: DecisionMemoryInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: DecisionMemoryRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
