import type { LocalSeoWorkerConfiguration } from "./configuration.js";
import type { LocalSeoWorkerDependencies } from "./integrations.js";
import { SeoManager } from "./seo-manager.js";
import type {
  EngineStatus,
  LocalSeoInput,
  LocalSeoWorkerRunReport,
} from "./types.js";

export class LocalSeoWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: LocalSeoWorkerRunReport | null = null;

  constructor(
    private readonly manager: SeoManager,
    private readonly config: LocalSeoWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: LocalSeoWorkerDependencies = {}) {
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
      reportingLine: [...this.config.reportingLine],
      seedReports: this.config.seedReports.map((report) => ({ ...report })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  consumeServiceOffer(input: LocalSeoInput = {}) {
    this.status = "consuming_offer";
    return this.finish(this.manager.consumeServiceOffer(input, this.config));
  }

  generateGoogleBusinessRecommendations(input: LocalSeoInput = {}) {
    this.status = "generating_gbp";
    return this.finish(
      this.manager.generateGoogleBusinessRecommendations(input, this.config),
    );
  }

  generateLandingPages(input: LocalSeoInput = {}) {
    this.status = "generating_pages";
    return this.finish(this.manager.generateLandingPages(input, this.config));
  }

  generateServicePages(input: LocalSeoInput = {}) {
    this.status = "generating_pages";
    return this.finish(this.manager.generateServicePages(input, this.config));
  }

  generateCityAreaPages(input: LocalSeoInput = {}) {
    this.status = "generating_pages";
    return this.finish(this.manager.generateCityAreaPages(input, this.config));
  }

  generateSeoTitlesAndMeta(input: LocalSeoInput = {}) {
    this.status = "generating_metadata";
    return this.finish(this.manager.generateSeoTitlesAndMeta(input, this.config));
  }

  generateStructuredDataRecommendations(input: LocalSeoInput = {}) {
    this.status = "generating_schema";
    return this.finish(
      this.manager.generateStructuredDataRecommendations(input, this.config),
    );
  }

  generateLocalKeywords(input: LocalSeoInput = {}) {
    this.status = "generating_keywords";
    return this.finish(this.manager.generateLocalKeywords(input, this.config));
  }

  generateInternalLinkingRecommendations(input: LocalSeoInput = {}) {
    this.status = "generating_pages";
    return this.finish(
      this.manager.generateInternalLinkingRecommendations(input, this.config),
    );
  }

  generateCitationRecommendations(input: LocalSeoInput = {}) {
    this.status = "generating_citations";
    return this.finish(
      this.manager.generateCitationRecommendations(input, this.config),
    );
  }

  evaluateSeoCompleteness(input: LocalSeoInput = {}) {
    this.status = "evaluating_completeness";
    return this.finish(this.manager.evaluateSeoCompleteness(input, this.config));
  }

  produceReport(input: LocalSeoInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  produceLocalSeoReport(input: LocalSeoInput = {}) {
    return this.produceReport(input);
  }

  submitReport(input: LocalSeoInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: LocalSeoInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  private finish(report: LocalSeoWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
