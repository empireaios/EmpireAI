import type { WorkerSelfCritiqueProtocolConfiguration } from "./configuration.js";
import { WorkerSelfCritiqueProtocolCore } from "./worker-self-critique-protocol-core.js";
import type {
  EngineStatus,
  WorkerSelfCritiqueProtocolInput,
  WorkerSelfCritiqueProtocolRunReport,
} from "./types.js";

export class WorkerSelfCritiqueProtocolController {
  private status: EngineStatus = "idle";
  private latestReport: WorkerSelfCritiqueProtocolRunReport | null = null;

  constructor(
    private readonly manager: WorkerSelfCritiqueProtocolCore,
    private readonly config: WorkerSelfCritiqueProtocolConfiguration,
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
      critiqueChecks: [...this.config.critiqueChecks],
      submissionDecisions: [...this.config.submissionDecisions],
      seedCritiques: this.config.seedCritiques.map((r) => ({
        ...r,
        evidenceReview: [...r.evidenceReview],
        weaknessesFound: [...r.weaknessesFound],
        suggestedImprovements: [...r.suggestedImprovements],
        checksPerformed: [...r.checksPerformed],
        checksFailed: [...r.checksFailed],
        assumptionsIdentified: [...r.assumptionsIdentified],
        missingEvidence: [...r.missingEvidence],
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

  critique(input: WorkerSelfCritiqueProtocolInput = {}) {
    this.status = "critiquing";
    return this.finish(this.manager.critique(input, this.config));
  }

  checkCompleteness(input: WorkerSelfCritiqueProtocolInput = {}) {
    this.status = "critiquing";
    return this.finish(this.manager.checkCompleteness(input, this.config));
  }

  checkConsistency(input: WorkerSelfCritiqueProtocolInput = {}) {
    this.status = "critiquing";
    return this.finish(this.manager.checkConsistency(input, this.config));
  }

  identifyWeaknesses(input: WorkerSelfCritiqueProtocolInput = {}) {
    this.status = "critiquing";
    return this.finish(this.manager.identifyWeaknesses(input, this.config));
  }

  recalculateConfidence(input: WorkerSelfCritiqueProtocolInput = {}) {
    this.status = "deciding";
    return this.finish(this.manager.recalculateConfidence(input, this.config));
  }

  decideSubmission(input: WorkerSelfCritiqueProtocolInput = {}) {
    this.status = "deciding";
    return this.finish(this.manager.decideSubmission(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: WorkerSelfCritiqueProtocolInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkerSelfCritiqueProtocolRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
