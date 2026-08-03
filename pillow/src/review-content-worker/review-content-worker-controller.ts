import type { ReviewContentWorkerConfiguration } from "./configuration.js";
import type { ReviewContentWorkerDependencies } from "./integrations.js";
import { ReviewManager } from "./review-manager.js";
import type { EngineStatus, RcwInput } from "./types.js";

export class ReviewContentWorkerController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: ReviewManager,
    private configuration: ReviewContentWorkerConfiguration,
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

  bindIntegrations(deps: ReviewContentWorkerDependencies = {}) {
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
    fn: () => ReturnType<ReviewManager["generateReviewArticle"]>,
  ) {
    this.status = status;
    try {
      return fn();
    } finally {
      this.status = "active";
    }
  }

  consumeAffiliateOpportunityReport(input: RcwInput = {}) {
    return this.run("consuming_opportunity", () =>
      this.manager.consumeAffiliateOpportunityReport(input, this.configuration),
    );
  }

  consumeComparisonSiteReport(input: RcwInput = {}) {
    return this.run("consuming_comparison", () =>
      this.manager.consumeComparisonSiteReport(input, this.configuration),
    );
  }

  generateReviewArticle(input: RcwInput = {}) {
    return this.run("generating_review", () =>
      this.manager.generateReviewArticle(input, this.configuration),
    );
  }

  generateProsAndCons(input: RcwInput = {}) {
    return this.run("generating_pros_cons", () =>
      this.manager.generateProsAndCons(input, this.configuration),
    );
  }

  recommendAlternatives(input: RcwInput = {}) {
    return this.run("recommending_alternatives", () =>
      this.manager.recommendAlternatives(input, this.configuration),
    );
  }

  produceBuyingRecommendation(input: RcwInput = {}) {
    return this.run("producing_buying_recommendation", () =>
      this.manager.produceBuyingRecommendation(input, this.configuration),
    );
  }

  explainIdealCustomerProfile(input: RcwInput = {}) {
    return this.run("documenting_icp", () =>
      this.manager.explainIdealCustomerProfile(input, this.configuration),
    );
  }

  highlightLimitations(input: RcwInput = {}) {
    return this.run("highlighting_limitations", () =>
      this.manager.highlightLimitations(input, this.configuration),
    );
  }

  produceReviewContentReport(input: RcwInput = {}) {
    return this.run("reporting", () =>
      this.manager.produceReviewContentReport(input, this.configuration),
    );
  }

  produceReport(input: RcwInput = {}) {
    return this.produceReviewContentReport(input);
  }

  submitReport(input: RcwInput = {}) {
    return this.run("reporting", () => this.manager.submitReport(input, this.configuration));
  }

  list() {
    return this.manager.list();
  }

  validate(input: RcwInput = {}) {
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
