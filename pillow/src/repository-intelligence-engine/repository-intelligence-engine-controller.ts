import type { RepositoryIntelligenceEngineConfiguration } from "./configuration.js";
import type { RepositoryIntelligenceEngineDependencies } from "./integrations.js";
import { RepositoryIntelligenceEngineManager } from "./repository-intelligence-engine-manager.js";
import type { RiengInput } from "./types.js";

export class RepositoryIntelligenceEngineController {
  private status: import("./types.js").EngineStatus = "idle";

  constructor(
    private readonly manager: RepositoryIntelligenceEngineManager,
    private readonly config: RepositoryIntelligenceEngineConfiguration,
  ) {}

  initialize() {
    this.status = "standby";
  }

  bindIntegrations(deps: RepositoryIntelligenceEngineDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getConfiguration() {
    return this.config;
  }

  getStatus() {
    return this.status;
  }

  getLatestReport() {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "connected";
    return handshakes;
  }

  discoverRepositoryStructure() {
    this.status = "scanning";
    const discovery = this.manager.discoverRepositoryStructure(this.config);
    this.status = "active";
    return discovery;
  }

  analyzeModulesAndServices() {
    this.status = "analyzing";
    return this.manager.analyzeModulesAndServices(this.config);
  }

  buildDependencyGraph() {
    this.status = "analyzing";
    return this.manager.buildDependencyGraph(this.config);
  }

  detectImplementationRelationships() {
    return this.manager.detectImplementationRelationships(this.config);
  }

  discoverArchitecturalBoundaries() {
    return this.manager.discoverArchitecturalBoundaries(this.config);
  }

  detectExistingImplementations() {
    return this.manager.detectExistingImplementations(this.config);
  }

  identifyReusableComponents() {
    return this.manager.identifyReusableComponents(this.config);
  }

  detectConflictsAndDuplicates() {
    return this.manager.detectConflictsAndDuplicates(this.config);
  }

  analyzeRepository() {
    this.status = "analyzing";
    return this.manager.analyzeRepository(this.config);
  }

  produceRepositoryIntelligenceReport(input: RiengInput = {}) {
    this.status = "reporting";
    return this.manager.produceRepositoryIntelligenceReport(input, this.config).then((report) => {
      this.status = report.validation.decision === "failed" ? "failed" : "active";
      return report;
    });
  }

  submitReport(input: RiengInput = {}) {
    return this.manager.submitReport(input, this.config);
  }

  validate(input: RiengInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = result.decision === "failed" ? "failed" : "active";
    return result;
  }

  runDiagnostics() {
    return this.manager.diagnostics(this.config);
  }

  getQ1303ConsumableContract() {
    return this.manager.getQ1303ConsumableContract();
  }

  list() {
    return this.manager.getReports();
  }
}
