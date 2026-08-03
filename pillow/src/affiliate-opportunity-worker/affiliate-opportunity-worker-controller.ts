import type { AffiliateOpportunityWorkerConfiguration } from "./configuration.js";
import type { AffiliateOpportunityWorkerDependencies } from "./integrations.js";
import { OpportunityManager } from "./opportunity-manager.js";
import type { AowInput, EngineStatus } from "./types.js";

export class AffiliateOpportunityWorkerController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: OpportunityManager,
    private configuration: AffiliateOpportunityWorkerConfiguration,
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

  bindIntegrations(deps: AffiliateOpportunityWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    const result = this.manager.connect(this.configuration);
    this.status = "active";
    void input;
    return result;
  }

  private run(status: EngineStatus, fn: () => ReturnType<OpportunityManager["discoverAffiliateProgrammes"]>) {
    this.status = status;
    try {
      return fn();
    } finally {
      this.status = "active";
    }
  }

  discoverAffiliateProgrammes(input: AowInput = {}) {
    return this.run("discovering_programmes", () =>
      this.manager.discoverAffiliateProgrammes(input, this.configuration),
    );
  }

  discoverAffiliateProducts(input: AowInput = {}) {
    return this.run("discovering_products", () =>
      this.manager.discoverAffiliateProducts(input, this.configuration),
    );
  }

  researchProfitableNiches(input: AowInput = {}) {
    return this.run("researching_niches", () =>
      this.manager.researchProfitableNiches(input, this.configuration),
    );
  }

  analyseCommissionStructures(input: AowInput = {}) {
    return this.run("analysing_commissions", () =>
      this.manager.analyseCommissionStructures(input, this.configuration),
    );
  }

  estimateMarketDemand(input: AowInput = {}) {
    return this.run("estimating_demand", () =>
      this.manager.estimateMarketDemand(input, this.configuration),
    );
  }

  compareCompetingOpportunities(input: AowInput = {}) {
    return this.run("comparing", () =>
      this.manager.compareCompetingOpportunities(input, this.configuration),
    );
  }

  rankOpportunities(input: AowInput = {}) {
    return this.run("ranking", () => this.manager.rankOpportunities(input, this.configuration));
  }

  identifyRisks(input: AowInput = {}) {
    return this.run("identifying_risks", () => this.manager.identifyRisks(input, this.configuration));
  }

  recommendHighPotentialOpportunities(input: AowInput = {}) {
    return this.run("recommending", () =>
      this.manager.recommendHighPotentialOpportunities(input, this.configuration),
    );
  }

  produceAffiliateOpportunityReport(input: AowInput = {}) {
    return this.run("reporting", () =>
      this.manager.produceAffiliateOpportunityReport(input, this.configuration),
    );
  }

  produceReport(input: AowInput = {}) {
    return this.produceAffiliateOpportunityReport(input);
  }

  submitReport(input: AowInput = {}) {
    return this.run("reporting", () => this.manager.submitReport(input, this.configuration));
  }

  list() {
    return this.manager.list();
  }

  validate(input: AowInput = {}) {
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
