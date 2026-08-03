import type { StrategicRecommendationEngineConfiguration } from "./configuration.js";
import { StrategicRecommendationManager } from "./strategic-recommendation-manager.js";
import type {
  EngineStatus,
  StrategicRecommendationInput,
  StrategicRecommendationRunReport,
} from "./types.js";

export class StrategicRecommendationController {
  private status: EngineStatus = "idle";
  private latestReport: StrategicRecommendationRunReport | null = null;

  constructor(
    private readonly manager: StrategicRecommendationManager,
    private readonly config: StrategicRecommendationEngineConfiguration,
  ) {}

  initialize() {
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
      recommendationCategories: [...this.config.recommendationCategories],
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  analyseState(input: StrategicRecommendationInput) {
    this.status = "analysing";
    return this.finish(this.manager.analyseState(input, this.config));
  }

  generateRecommendations(input: StrategicRecommendationInput) {
    this.status = "generating";
    return this.finish(this.manager.generateRecommendations(input, this.config));
  }

  rankRecommendations(input: StrategicRecommendationInput) {
    this.status = "ranking";
    return this.finish(this.manager.rankRecommendations(input, this.config));
  }

  producePackages(input: StrategicRecommendationInput) {
    this.status = "generating";
    return this.finish(this.manager.producePackages(input, this.config));
  }

  validateRecommendations(input: StrategicRecommendationInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validateRecommendations(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: StrategicRecommendationRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
