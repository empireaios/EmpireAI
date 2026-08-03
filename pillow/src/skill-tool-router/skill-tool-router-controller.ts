import type { SkillToolRouterConfiguration } from "./configuration.js";
import { SkillToolRouterCore } from "./skill-tool-router-core.js";
import type {
  EngineStatus,
  SkillToolRouterInput,
  SkillToolRouterRunReport,
} from "./types.js";

export class SkillToolRouterController {
  private status: EngineStatus = "idle";
  private latestReport: SkillToolRouterRunReport | null = null;

  constructor(
    private readonly manager: SkillToolRouterCore,
    private readonly config: SkillToolRouterConfiguration,
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
      routingFactors: [...this.config.routingFactors],
      workerCatalog: this.config.workerCatalog.map((w) => ({
        ...w,
        capabilities: [...w.capabilities],
        skills: [...w.skills],
        approvedTools: [...w.approvedTools],
      })),
      toolCatalog: this.config.toolCatalog.map((t) => ({
        ...t,
        compatibleCapabilities: [...t.compatibleCapabilities],
      })),
      capabilityKeywords: { ...this.config.capabilityKeywords },
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  route(input: SkillToolRouterInput) {
    this.status = "recommending";
    return this.finish(this.manager.route(input, this.config));
  }

  analyseCapabilities(input: SkillToolRouterInput) {
    this.status = "analysing";
    return this.finish(this.manager.analyseCapabilities(input, this.config));
  }

  queryRegistry(input: SkillToolRouterInput) {
    this.status = "matching";
    return this.finish(this.manager.queryRegistry(input, this.config));
  }

  matchWorkers(input: SkillToolRouterInput) {
    this.status = "matching";
    return this.finish(this.manager.matchWorkers(input, this.config));
  }

  matchTools(input: SkillToolRouterInput) {
    this.status = "matching";
    return this.finish(this.manager.matchTools(input, this.config));
  }

  recommend(input: SkillToolRouterInput) {
    this.status = "recommending";
    return this.finish(this.manager.recommend(input, this.config));
  }

  listRoutes() {
    this.status = "active";
    return this.finish(this.manager.listRoutes(this.config));
  }

  validateRouting(input: SkillToolRouterInput = { executiveRequest: "" }) {
    this.status = "active";
    return this.finish(this.manager.validateRouting(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: SkillToolRouterRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
