import type { PeerReviewRuntimeConfiguration } from "./configuration.js";
import { PeerReviewRuntimeCore } from "./peer-review-runtime-core.js";
import type {
  EngineStatus,
  PeerReviewRuntimeInput,
  PeerReviewRuntimeRunReport,
} from "./types.js";

export class PeerReviewRuntimeController {
  private status: EngineStatus = "idle";
  private latestReport: PeerReviewRuntimeRunReport | null = null;

  constructor(
    private readonly manager: PeerReviewRuntimeCore,
    private readonly config: PeerReviewRuntimeConfiguration,
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
      reviewOutcomes: [...this.config.reviewOutcomes],
      reviewCriteria: [...this.config.reviewCriteria],
      seedReviews: this.config.seedReviews.map((r) => ({
        ...r,
        reviewers: [...r.reviewers],
        reviewFindings: r.reviewFindings.map((f) => ({ ...f })),
        issuesFound: [...r.issuesFound],
        requiredRevisions: [...r.requiredRevisions],
        independentReviews: r.independentReviews.map((ir) => ({
          ...ir,
          findings: [...ir.findings],
          issues: [...ir.issues],
          criteriaScores: { ...ir.criteriaScores },
        })),
        disagreements: [...r.disagreements],
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

  submitWork(input: PeerReviewRuntimeInput = {}) {
    this.status = "reviewing";
    return this.finish(this.manager.submitWork(input, this.config));
  }

  determineRequired(input: PeerReviewRuntimeInput = {}) {
    this.status = "selecting";
    return this.finish(this.manager.determineRequired(input, this.config));
  }

  selectReviewers(input: PeerReviewRuntimeInput = {}) {
    this.status = "selecting";
    return this.finish(this.manager.selectReviewers(input, this.config));
  }

  deliverToReviewers(input: PeerReviewRuntimeInput = {}) {
    this.status = "reviewing";
    return this.finish(this.manager.deliverToReviewers(input, this.config));
  }

  collectReviews(input: PeerReviewRuntimeInput = {}) {
    this.status = "reviewing";
    return this.finish(this.manager.collectReviews(input, this.config));
  }

  compareReviews(input: PeerReviewRuntimeInput = {}) {
    this.status = "comparing";
    return this.finish(this.manager.compareReviews(input, this.config));
  }

  requestRevision(input: PeerReviewRuntimeInput = {}) {
    this.status = "reviewing";
    return this.finish(this.manager.requestRevision(input, this.config));
  }

  escalate(input: PeerReviewRuntimeInput = {}) {
    this.status = "escalating";
    return this.finish(this.manager.escalate(input, this.config));
  }

  review(input: PeerReviewRuntimeInput = {}) {
    this.status = "reviewing";
    return this.finish(this.manager.review(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: PeerReviewRuntimeInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: PeerReviewRuntimeRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
