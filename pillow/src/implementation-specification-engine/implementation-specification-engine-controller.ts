import type { ImplementationSpecificationEngineConfiguration } from "./configuration.js";
import type { ImplementationSpecificationEngineDependencies } from "./integrations.js";
import { ImplementationSpecificationEngineManager } from "./implementation-specification-engine-manager.js";
import type { IsengInput, ImplementationSpecificationReport, EngineStatus } from "./types.js";

export class ImplementationSpecificationEngineController {
  private status: EngineStatus = "idle";

  constructor(
    private readonly manager: ImplementationSpecificationEngineManager,
    private readonly config: ImplementationSpecificationEngineConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ImplementationSpecificationEngineDependencies = {}) {
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
      scanRoots: [...this.config.scanRoots],
      seedReports: this.config.seedReports.map((report) => ({ ...report })),
    };
  }

  getLatestReport(): ImplementationSpecificationReport | null {
    return this.manager.getLatestReport();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "active";
    return handshakes;
  }

  parseApprovedRoadmapMission(input: IsengInput = {}) {
    this.status = "parsing";
    const result = this.manager.parseApprovedRoadmapMission(input);
    this.status = "active";
    return result;
  }

  analyseRepositoryArchitecture(input: IsengInput = {}) {
    this.status = "analysing";
    const result = this.manager.analyseRepositoryArchitecture(this.config);
    void input;
    this.status = "active";
    return result;
  }

  discoverImplementationDependencies(input: IsengInput = {}) {
    this.status = "discovering";
    const result = this.manager.discoverImplementationDependencies(input, this.config);
    this.status = "active";
    return result;
  }

  detectExistingImplementationsToPreserve(input: IsengInput = {}) {
    this.status = "analysing";
    const result = this.manager.detectExistingImplementationsToPreserve(input, this.config);
    this.status = "active";
    return result;
  }

  generateImplementationSpecification(input: IsengInput = {}) {
    this.status = "generating";
    const result = this.manager.generateImplementationSpecification(input, this.config);
    this.status = "active";
    return result;
  }

  async produceSpecificationReport(input: IsengInput = {}) {
    this.status = "reporting";
    const report = await this.manager.produceSpecificationReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  async produceReport(input: IsengInput = {}) {
    return this.produceSpecificationReport(input);
  }

  async submitReport(input: IsengInput = {}) {
    this.status = "reporting";
    const report = await this.manager.submitReport(input, this.config);
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }

  list() {
    return this.manager.list();
  }

  validate(input: IsengInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = "active";
    return result;
  }

  getQ1302ConsumableContract() {
    return this.manager.getQ1302ConsumableContract();
  }

  getSpecificationHistory(limit = 100) {
    return this.manager.getSpecificationHistory(limit);
  }

  diagnostics() {
    return this.manager.diagnostics(this.config);
  }
}
