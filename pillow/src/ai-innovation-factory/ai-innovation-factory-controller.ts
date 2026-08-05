import type { AiInnovationFactoryConfiguration } from "./configuration.js";

import type { AiInnovationFactoryDependencies } from "./integrations.js";

import { AiInnovationFactoryManager } from "./ai-innovation-factory-manager.js";

import type { AifrtInput, AiInnovationReport, EngineStatus } from "./types.js";



export class AiInnovationFactoryController {

  private status: EngineStatus = "idle";



  constructor(

    private readonly manager: AiInnovationFactoryManager,

    private readonly config: AiInnovationFactoryConfiguration,

  ) {}



  initialize() {

    this.manager.ensureSeeded(this.config);

    this.status = "active";

  }



  bindIntegrations(deps: AiInnovationFactoryDependencies = {}) {

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

      researchCatalogPaths: [...this.config.researchCatalogPaths],

      seedReports: this.config.seedReports.map((report) => ({ ...report })),

    };

  }



  getLatestReport(): AiInnovationReport | null {

    return this.manager.getLatestReport();

  }



  connect() {

    this.status = "connecting";

    const handshakes = this.manager.connect(this.config);

    this.status = "active";

    return handshakes;

  }



  verifySeriesCompletePrerequisite() {

    this.status = "evaluating";

    const result = this.manager.verifySeriesCompletePrerequisite();

    this.status = "active";

    return result;

  }



  researchEmergingTechnologies() {

    this.status = "researching";

    const result = this.manager.researchEmergingTechnologies(this.config);

    this.status = "active";

    return result;

  }



  trackModelsAndApis() {

    this.status = "researching";

    const result = this.manager.trackModelsAndApis();

    this.status = "active";

    return result;

  }



  discoverBusinessOpportunities() {

    this.status = "researching";

    const result = this.manager.discoverBusinessOpportunities();

    this.status = "active";

    return result;

  }



  evaluateArchitecturalImprovements() {

    this.status = "evaluating";

    const result = this.manager.evaluateArchitecturalImprovements();

    this.status = "active";

    return result;

  }



  analyseOperationalImprovements() {

    this.status = "evaluating";

    const result = this.manager.analyseOperationalImprovements();

    this.status = "active";

    return result;

  }



  prioritiseInnovationProposals(proposals: import("./types.js").InnovationProposal[]) {

    this.status = "prioritising";

    const result = this.manager.prioritiseInnovationProposals(proposals);

    this.status = "active";

    return result;

  }



  generateImplementationRecommendations(proposals: import("./types.js").InnovationProposal[]) {

    const result = this.manager.generateImplementationRecommendations(proposals);

    this.status = "active";

    return result;

  }



  async produceAiInnovationReport(input: AifrtInput = {}) {

    this.status = "reporting";

    const report = await this.manager.produceAiInnovationReport(input, this.config);

    this.status = report.validation.decision === "fail" ? "failed" : report.seriesCompleteActivation ? "active" : "standby";

    return report;

  }



  async researchInnovations(input: AifrtInput = {}) {

    return this.produceAiInnovationReport(input);

  }



  async submitReport(input: AifrtInput = {}) {

    this.status = "reporting";

    const report = await this.manager.submitReport(input, this.config);

    this.status = report.validation.decision === "fail" ? "failed" : "active";

    return report;

  }



  list() {

    return this.manager.list();

  }



  validate(input: AifrtInput = {}) {

    this.status = "validating";

    const result = this.manager.validate(input);

    this.status = "active";

    return result;

  }



  getQ1301ConsumableContract() {

    return this.manager.getQ1301ConsumableContract();

  }



  getInnovationHistory(limit = 100) {

    return this.manager.getInnovationHistory(limit);

  }



  diagnostics() {

    return this.manager.diagnostics(this.config);

  }

}


