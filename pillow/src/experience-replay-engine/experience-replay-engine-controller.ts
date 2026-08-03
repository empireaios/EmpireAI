import type { ExperienceReplayEngineConfiguration } from "./configuration.js";
import { ExperienceReplayEngineCore } from "./experience-replay-engine-core.js";
import type {
  EngineStatus,
  ExperienceReplayEngineInput,
  ExperienceReplayEngineRunReport,
} from "./types.js";

export class ExperienceReplayEngineController {
  private status: EngineStatus = "idle";
  private latestReport: ExperienceReplayEngineRunReport | null = null;

  constructor(
    private readonly manager: ExperienceReplayEngineCore,
    private readonly config: ExperienceReplayEngineConfiguration,
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
      experienceSources: [...this.config.experienceSources],
      historicalCatalog: this.config.historicalCatalog.map((h) => ({
        ...h,
        factors: [...h.factors],
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

  replay(input: ExperienceReplayEngineInput = {}) {
    this.status = "retrieving";
    return this.finish(this.manager.replay(input, this.config));
  }

  analyseSuccess(input: ExperienceReplayEngineInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseSuccess(input, this.config));
  }

  analyseFailure(input: ExperienceReplayEngineInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseFailure(input, this.config));
  }

  analyseRejection(input: ExperienceReplayEngineInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseRejection(input, this.config));
  }

  analyseGrandKing(input: ExperienceReplayEngineInput = {}) {
    this.status = "analysing";
    return this.finish(this.manager.analyseGrandKing(input, this.config));
  }

  detectPatterns(input: ExperienceReplayEngineInput = {}) {
    this.status = "learning";
    return this.finish(this.manager.detectPatterns(input, this.config));
  }

  extractLessons(input: ExperienceReplayEngineInput = {}) {
    this.status = "learning";
    return this.finish(this.manager.extractLessons(input, this.config));
  }

  recommend(input: ExperienceReplayEngineInput = {}) {
    this.status = "recommending";
    return this.finish(this.manager.recommend(input, this.config));
  }

  listRecords() {
    this.status = "active";
    return this.finish(this.manager.listRecords(this.config));
  }

  validateExperience(input: ExperienceReplayEngineInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validateExperience(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ExperienceReplayEngineRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
