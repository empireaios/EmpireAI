import type { ComparisonSiteWorkerConfiguration } from "./configuration.js";
import type { ComparisonSiteWorkerDependencies } from "./integrations.js";
import { ComparisonManager } from "./comparison-manager.js";
import type { CswInput, EngineStatus } from "./types.js";

export class ComparisonSiteWorkerController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: ComparisonManager,
    private configuration: ComparisonSiteWorkerConfiguration,
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

  bindIntegrations(deps: ComparisonSiteWorkerDependencies = {}) {
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
    fn: () => ReturnType<ComparisonManager["generateComparisonPage"]>,
  ) {
    this.status = status;
    try {
      return fn();
    } finally {
      this.status = "active";
    }
  }

  consumeAffiliateOpportunityReport(input: CswInput = {}) {
    return this.run("consuming_opportunity", () =>
      this.manager.consumeAffiliateOpportunityReport(input, this.configuration),
    );
  }

  generateComparisonPage(input: CswInput = {}) {
    return this.run("generating_comparison", () =>
      this.manager.generateComparisonPage(input, this.configuration),
    );
  }

  generateRankingPage(input: CswInput = {}) {
    return this.run("generating_ranking", () =>
      this.manager.generateRankingPage(input, this.configuration),
    );
  }

  generateBuyerGuide(input: CswInput = {}) {
    return this.run("generating_buyer_guide", () =>
      this.manager.generateBuyerGuide(input, this.configuration),
    );
  }

  generateComparisonTables(input: CswInput = {}) {
    return this.run("building_tables", () =>
      this.manager.generateComparisonTables(input, this.configuration),
    );
  }

  documentMethodology(input: CswInput = {}) {
    return this.run("documenting_methodology", () =>
      this.manager.documentMethodology(input, this.configuration),
    );
  }

  produceComparisonSiteReport(input: CswInput = {}) {
    return this.run("reporting", () =>
      this.manager.produceComparisonSiteReport(input, this.configuration),
    );
  }

  produceReport(input: CswInput = {}) {
    return this.produceComparisonSiteReport(input);
  }

  submitReport(input: CswInput = {}) {
    return this.run("reporting", () => this.manager.submitReport(input, this.configuration));
  }

  list() {
    return this.manager.list();
  }

  validate(input: CswInput = {}) {
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
