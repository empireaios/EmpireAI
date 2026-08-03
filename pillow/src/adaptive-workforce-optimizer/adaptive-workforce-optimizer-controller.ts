import type { AdaptiveWorkforceOptimizerConfiguration } from "./configuration.js";
import { AdaptiveWorkforceOptimizerCore } from "./adaptive-workforce-optimizer-core.js";
import type {
  AdaptiveWorkforceOptimizerInput,
  AdaptiveWorkforceOptimizerRunReport,
  EngineStatus,
} from "./types.js";

export class AdaptiveWorkforceOptimizerController {
  private status: EngineStatus = "idle";
  private latestReport: AdaptiveWorkforceOptimizerRunReport | null = null;

  constructor(
    private readonly manager: AdaptiveWorkforceOptimizerCore,
    private readonly config: AdaptiveWorkforceOptimizerConfiguration,
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
      optimizationTargets: [...this.config.optimizationTargets],
      seedOptimizations: this.config.seedOptimizations.map((r) => ({
        ...r,
        workers: [...r.workers],
        bottlenecks: [...r.bottlenecks],
        improvementOpportunities: [...r.improvementOpportunities],
        recommendedChanges: r.recommendedChanges.map((c) => ({
          ...c,
          affectedWorkers: [...c.affectedWorkers],
        })),
        expectedBenefits: [...r.expectedBenefits],
        supportingEvidence: [...r.supportingEvidence],
        overloadedWorkers: [...r.overloadedWorkers],
        underutilizedWorkers: [...r.underutilizedWorkers],
        idleWorkers: [...r.idleWorkers],
        optimizationTargetsAddressed: [...r.optimizationTargetsAddressed],
        currentPerformance: { ...r.currentPerformance },
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

  analyseUtilization(input: AdaptiveWorkforceOptimizerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseUtilization(input, this.config));
  }

  analysePerformance(input: AdaptiveWorkforceOptimizerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analysePerformance(input, this.config));
  }

  analyseRouting(input: AdaptiveWorkforceOptimizerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseRouting(input, this.config));
  }

  analyseCollaboration(input: AdaptiveWorkforceOptimizerInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseCollaboration(input, this.config));
  }

  detectBottlenecks(input: AdaptiveWorkforceOptimizerInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectBottlenecks(input, this.config));
  }

  detectOverloaded(input: AdaptiveWorkforceOptimizerInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectOverloaded(input, this.config));
  }

  detectUnderutilized(input: AdaptiveWorkforceOptimizerInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectUnderutilized(input, this.config));
  }

  recommend(input: AdaptiveWorkforceOptimizerInput = {}) {
    this.status = "recommending";
    return this.finish(this.manager.recommend(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: AdaptiveWorkforceOptimizerInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: AdaptiveWorkforceOptimizerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
