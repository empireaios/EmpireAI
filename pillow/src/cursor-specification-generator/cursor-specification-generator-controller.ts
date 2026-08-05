import type { CursorSpecificationGeneratorConfiguration } from "./configuration.js";
import type { CursorSpecificationGeneratorDependencies } from "./integrations.js";
import { CursorSpecificationGeneratorManager } from "./cursor-specification-generator-manager.js";
import type { CsgenInput } from "./types.js";

export class CursorSpecificationGeneratorController {
  private status: import("./types.js").EngineStatus = "idle";

  constructor(
    private readonly manager: CursorSpecificationGeneratorManager,
    private readonly config: CursorSpecificationGeneratorConfiguration,
  ) {}

  initialize() {
    this.status = "standby";
  }

  bindIntegrations(deps: CursorSpecificationGeneratorDependencies = {}) {
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

  getLatestSpecification() {
    return this.manager.getLatestSpecification();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "connected";
    return handshakes;
  }

  consumeApprovedRoadmapMission(input: CsgenInput = {}) {
    this.status = "active";
    return this.manager.consumeApprovedRoadmapMission(input);
  }

  consumeRepositoryIntelligence() {
    this.status = "active";
    return this.manager.consumeRepositoryIntelligence();
  }

  consumeMissionPlanning() {
    this.status = "active";
    return this.manager.consumeMissionPlanning();
  }

  consumeImplementationSpecification() {
    this.status = "active";
    return this.manager.consumeImplementationSpecification();
  }

  generateCursorSpecification(input: CsgenInput = {}) {
    this.status = "generating";
    const spec = this.manager.generateCursorSpecification(input);
    this.status = spec ? "active" : "blocked";
    return spec;
  }

  validateBoundaries() {
    return this.manager.validateBoundaries();
  }

  validateGovernance() {
    return this.manager.validateGovernance();
  }

  validateCompleteness(input: CsgenInput = {}) {
    this.status = "validating";
    const result = this.manager.validateCompleteness(input);
    this.status = result.passed ? "active" : "blocked";
    return result;
  }

  produceCursorSpecificationReport(input: CsgenInput = {}) {
    this.status = "reporting";
    return this.manager.produceCursorSpecificationReport(input, this.config).then((report) => {
      this.status = report.validation.decision === "failed" ? "failed" : "active";
      return report;
    });
  }

  submitReport(input: CsgenInput = {}) {
    return this.manager.submitReport(input, this.config);
  }

  validate(input: CsgenInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = result.decision === "failed" ? "failed" : "active";
    return result;
  }

  runDiagnostics() {
    return this.manager.diagnostics(this.config);
  }

  getQ1305ConsumableContract() {
    return this.manager.getQ1305ConsumableContract();
  }

  list() {
    return this.manager.getReports();
  }

  getSpecificationHistory() {
    return this.manager.getSpecificationHistory();
  }
}
