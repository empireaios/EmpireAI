import type { ProgrammeCertificationFactoryConfiguration } from "./configuration.js";
import type { ProgrammeCertificationFactoryDependencies } from "./integrations.js";
import { ProgrammeCertificationFactoryManager } from "./programme-certification-factory-manager.js";
import type { PcfctInput, ProgrammeCode } from "./types.js";

export class ProgrammeCertificationFactoryController {
  private status: import("./types.js").EngineStatus = "idle";

  constructor(
    private readonly manager: ProgrammeCertificationFactoryManager,
    private readonly config: ProgrammeCertificationFactoryConfiguration,
  ) {}

  initialize() {
    this.status = "standby";
  }

  bindIntegrations(deps: ProgrammeCertificationFactoryDependencies = {}) {
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

  getLatestFinalCertification() {
    return this.manager.getLatestFinalCertification();
  }

  getDiscoveredProgrammes() {
    return this.manager.getDiscoveredProgrammes();
  }

  connect() {
    this.status = "connecting";
    const handshakes = this.manager.connect(this.config);
    this.status = "connected";
    return handshakes;
  }

  discoverApprovedProgrammes() {
    this.status = "discovering";
    const result = this.manager.discoverApprovedProgrammes(this.config);
    this.status = "active";
    return result;
  }

  auditProgrammeRepository(input: PcfctInput = {}) {
    this.status = "auditing";
    const result = this.manager.auditProgrammeRepository(input, this.config);
    this.status = "active";
    return result;
  }

  classifyMissions(input: PcfctInput = {}) {
    this.status = "classifying";
    const result = this.manager.classifyMissions(input);
    this.status = "active";
    return result;
  }

  compareAgainstRoadmapEvidence() {
    return this.manager.compareAgainstRoadmapEvidence();
  }

  produceProgrammeGapAnalysis(input: PcfctInput = {}) {
    return this.manager.produceProgrammeGapAnalysis(input);
  }

  generateCompletionRecommendations(input: PcfctInput = {}) {
    return this.manager.generateCompletionRecommendations(input);
  }

  verifyCompletionAfterCorrections(input: PcfctInput = {}) {
    return this.manager.verifyCompletionAfterCorrections(input, this.config);
  }

  certifyProgramme(input: PcfctInput = {}) {
    this.status = "certifying";
    const result = this.manager.certifyProgramme(input, this.config);
    this.status = "active";
    return result;
  }

  produceProgrammeCertificationReport(input: PcfctInput = {}) {
    this.status = "reporting";
    return this.manager.produceProgrammeCertificationReport(input, this.config).then((report) => {
      this.status = report.validation.decision === "failed" ? "failed" : "active";
      return report;
    });
  }

  produceFinalRepositoryConstitutionalCertification(input: PcfctInput = {}) {
    this.status = "certifying";
    const result = this.manager.produceFinalRepositoryConstitutionalCertification(input, this.config);
    this.status = "active";
    return result;
  }

  submitReport(input: PcfctInput = {}) {
    return this.manager.submitReport(input, this.config);
  }

  validate(input: PcfctInput = {}) {
    this.status = "validating";
    const result = this.manager.validate(input);
    this.status = result.decision === "failed" ? "failed" : "active";
    return result;
  }

  runDiagnostics() {
    return this.manager.diagnostics(this.config);
  }

  getQSeriesConstitutionalCompletionContract() {
    return this.manager.getQSeriesConstitutionalCompletionContract();
  }

  list() {
    return this.manager.getReports();
  }

  getCertificationHistory() {
    return this.manager.getCertificationHistory();
  }
}
