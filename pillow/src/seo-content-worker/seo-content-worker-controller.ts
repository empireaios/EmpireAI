import type { SeoContentWorkerConfiguration } from "./configuration.js";
import type { SeoContentWorkerDependencies } from "./integrations.js";
import { SeoManager } from "./seo-manager.js";
import type { EngineStatus, SeowInput } from "./types.js";

export class SeoContentWorkerController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: SeoManager,
    private configuration: SeoContentWorkerConfiguration,
  ) {}

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return this.configuration;
  }

  getStatus() {
    return this.status;
  }

  getLatestReport() {
    return this.manager.getStore().getLatestReport();
  }

  initialize() {
    this.manager.initialize(this.configuration);
    this.status = "idle";
  }

  bindIntegrations(deps: SeoContentWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    const result = this.manager.connect(this.configuration);
    this.status = "active";
    void input;
    return result;
  }

  private run(
    status: EngineStatus,
    fn: () => ReturnType<SeoManager["generateSeoContentPlan"]>,
  ) {
    this.status = status;
    try {
      return fn();
    } finally {
      this.status = "active";
    }
  }

  consumeAffiliateOpportunityReport(input: SeowInput = {}) {
    return this.run("consuming_opportunity", () =>
      this.manager.consumeAffiliateOpportunityReport(input, this.configuration),
    );
  }

  consumeReviewContentReport(input: SeowInput = {}) {
    return this.run("consuming_review", () =>
      this.manager.consumeReviewContentReport(input, this.configuration),
    );
  }

  generateSeoContentPlan(input: SeowInput = {}) {
    return this.run("planning_content", () =>
      this.manager.generateSeoContentPlan(input, this.configuration),
    );
  }

  generateKeywordMapping(input: SeowInput = {}) {
    return this.run("mapping_keywords", () =>
      this.manager.generateKeywordMapping(input, this.configuration),
    );
  }

  generateArticleBrief(input: SeowInput = {}) {
    return this.run("generating_brief", () =>
      this.manager.generateArticleBrief(input, this.configuration),
    );
  }

  generateSeoArticle(input: SeowInput = {}) {
    return this.run("generating_article", () =>
      this.manager.generateSeoArticle(input, this.configuration),
    );
  }

  generateInternalLinkingPlan(input: SeowInput = {}) {
    return this.run("recommending_links", () =>
      this.manager.generateInternalLinkingPlan(input, this.configuration),
    );
  }

  evaluateContentCompleteness(input: SeowInput = {}) {
    return this.run("evaluating_completeness", () =>
      this.manager.evaluateContentCompleteness(input, this.configuration),
    );
  }

  produceSeoContentReport(input: SeowInput = {}) {
    return this.run("reporting", () =>
      this.manager.produceSeoContentReport(input, this.configuration),
    );
  }

  produceReport(input: SeowInput = {}) {
    return this.produceSeoContentReport(input);
  }

  submitReport(input: SeowInput = {}) {
    return this.run("reporting", () => this.manager.submitReport(input, this.configuration));
  }

  list() {
    return this.manager.list();
  }

  validate(input: SeowInput = {}) {
    this.status = "validating";
    try {
      return this.manager.validate(input, this.configuration);
    } finally {
      this.status = "active";
    }
  }

  diagnostics() {
    return this.manager.diagnostics();
  }

  runDiagnostics() {
    return this.manager.runDiagnostics();
  }
}
