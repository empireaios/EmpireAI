import type { HookWorkerConfiguration } from "./configuration.js";
import type { HookWorkerDependencies } from "./integrations.js";
import { HookManager } from "./hook-manager.js";
import type {
  EngineStatus,
  HookWorkerInput,
  HookWorkerRunReport,
} from "./types.js";

export class HookWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: HookWorkerRunReport | null = null;

  constructor(
    private readonly manager: HookManager,
    private readonly config: HookWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: HookWorkerDependencies = {}) {
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
      supportedHookTypes: [...this.config.supportedHookTypes],
      reportingLine: [...this.config.reportingLine],
      seedHookReports: this.config.seedHookReports.map((report) => ({
        ...report,
        primaryHook: { ...report.primaryHook },
        alternativeHooks: report.alternativeHooks.map((h) => ({ ...h })),
        curiosityGaps: report.curiosityGaps.map((g) => ({ ...g })),
        retentionLoops: report.retentionLoops.map((l) => ({ ...l })),
        continuationMoments: report.continuationMoments.map((m) => ({ ...m })),
        pacingRecommendations: report.pacingRecommendations.map((p) => ({ ...p })),
        traceabilityRefs: [...report.traceabilityRefs],
        preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
        selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
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

  receiveApprovedScript(input: HookWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedScript(input, this.config));
  }

  generateOpeningHooks(input: HookWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateOpeningHooks(input, this.config));
  }

  generateCuriosityGaps(input: HookWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateCuriosityGaps(input, this.config));
  }

  generateRetentionLoops(input: HookWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateRetentionLoops(input, this.config));
  }

  generateContinuationMoments(input: HookWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateContinuationMoments(input, this.config));
  }

  improvePacingRecommendations(input: HookWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.improvePacingRecommendations(input, this.config));
  }

  improveAudienceEngagement(input: HookWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.improveAudienceEngagement(input, this.config));
  }

  generateMultipleHookAlternatives(input: HookWorkerInput = {}) {
    this.status = "generating";
    return this.finish(this.manager.generateMultipleHookAlternatives(input, this.config));
  }

  selfReviewHookEffectiveness(input: HookWorkerInput = {}) {
    this.status = "reviewing";
    return this.finish(this.manager.selfReviewHookEffectiveness(input, this.config));
  }

  produceHookReport(input: HookWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceHookReport(input, this.config));
  }

  submitReport(input: HookWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: HookWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: HookWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
