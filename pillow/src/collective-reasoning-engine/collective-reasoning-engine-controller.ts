import type { CollectiveReasoningEngineConfiguration } from "./configuration.js";
import { CollectiveReasoningEngineCore } from "./collective-reasoning-engine-core.js";
import type {
  CollectiveReasoningEngineInput,
  CollectiveReasoningEngineRunReport,
  EngineStatus,
} from "./types.js";

export class CollectiveReasoningEngineController {
  private status: EngineStatus = "idle";
  private latestReport: CollectiveReasoningEngineRunReport | null = null;

  constructor(
    private readonly manager: CollectiveReasoningEngineCore,
    private readonly config: CollectiveReasoningEngineConfiguration,
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
      supportedModes: [...this.config.supportedModes],
      expertCatalog: this.config.expertCatalog.map((p) => ({
        ...p,
        expertise: [...p.expertise],
      })),
      expertiseKeywords: { ...this.config.expertiseKeywords },
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  reason(input: CollectiveReasoningEngineInput) {
    this.status = "debating";
    return this.finish(this.manager.reason(input, this.config));
  }

  identifyExpertise(input: CollectiveReasoningEngineInput) {
    this.status = "analysing";
    return this.finish(this.manager.identifyExpertise(input, this.config));
  }

  assemblePanel(input: CollectiveReasoningEngineInput) {
    this.status = "assembling";
    return this.finish(this.manager.assemblePanel(input, this.config));
  }

  collectOpinions(input: CollectiveReasoningEngineInput) {
    this.status = "analysing";
    return this.finish(this.manager.collectOpinions(input, this.config));
  }

  detectConflicts(input: CollectiveReasoningEngineInput) {
    this.status = "debating";
    return this.finish(this.manager.detectConflicts(input, this.config));
  }

  debate(input: CollectiveReasoningEngineInput) {
    this.status = "debating";
    return this.finish(this.manager.debate(input, this.config));
  }

  buildConsensus(input: CollectiveReasoningEngineInput) {
    this.status = "consensus";
    return this.finish(this.manager.buildConsensus(input, this.config));
  }

  recommend(input: CollectiveReasoningEngineInput) {
    this.status = "consensus";
    return this.finish(this.manager.recommend(input, this.config));
  }

  listRecords() {
    this.status = "active";
    return this.finish(this.manager.listRecords(this.config));
  }

  validateReasoning(input: CollectiveReasoningEngineInput = { executiveQuestion: "" }) {
    this.status = "active";
    return this.finish(this.manager.validateReasoning(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: CollectiveReasoningEngineRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
