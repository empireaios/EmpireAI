import type { EscalationFrameworkConfiguration } from "./configuration.js";
import { EscalationFrameworkCore } from "./escalation-framework-core.js";
import type {
  EngineStatus,
  EscalationFrameworkInput,
  EscalationFrameworkRunReport,
} from "./types.js";

export class EscalationFrameworkController {
  private status: EngineStatus = "idle";
  private latestReport: EscalationFrameworkRunReport | null = null;

  constructor(
    private readonly manager: EscalationFrameworkCore,
    private readonly config: EscalationFrameworkConfiguration,
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
      escalationCategories: [...this.config.escalationCategories],
      seedEscalations: this.config.seedEscalations.map((r) => ({
        ...r,
        relatedWorkers: [...r.relatedWorkers],
        currentEvidence: [...r.currentEvidence],
        recommendedActions: [...r.recommendedActions],
        detectedConditions: [...r.detectedConditions],
        riskAssessment: {
          ...r.riskAssessment,
          factors: [...r.riskAssessment.factors],
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

  detect(input: EscalationFrameworkInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detect(input, this.config));
  }

  escalateLowConfidence(input: EscalationFrameworkInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.escalateLowConfidence(input, this.config));
  }

  escalateMissingInformation(input: EscalationFrameworkInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.escalateMissingInformation(input, this.config));
  }

  escalateConflictingRecommendations(input: EscalationFrameworkInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.escalateConflictingRecommendations(input, this.config));
  }

  escalateWorkerDeadlock(input: EscalationFrameworkInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.escalateWorkerDeadlock(input, this.config));
  }

  escalateExecutiveDecision(input: EscalationFrameworkInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.escalateExecutiveDecision(input, this.config));
  }

  generate(input: EscalationFrameworkInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.generate(input, this.config));
  }

  routeToPillow(input: EscalationFrameworkInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.routeToPillow(input, this.config));
  }

  list() {
    this.status = "tracking";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: EscalationFrameworkInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: EscalationFrameworkRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
