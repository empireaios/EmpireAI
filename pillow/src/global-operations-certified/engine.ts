import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildGlobalOperationsCertifiedConfiguration, type GlobalOperationsCertifiedConfiguration } from "./configuration.js";
import type { GlobalOperationsCertifiedDependencies } from "./dependencies.js";
import { GlobalModuleValidationCoordinator } from "./module-validators.js";
import { appendGocLog, getGocLogs, resetGocLogsForTesting } from "./goc-logging.js";
import { CERTIFIED_MODULE_IDS, GLOBAL_OPERATIONS_CERTIFIED_ID, GLOBAL_OPERATIONS_CERTIFIED_SYSTEM_PATH, GOC_METADATA_VERSION } from "./paths.js";
import type { CertificationActionInput, CertificationEngineRecord, CertificationRunReport, GlobalOperationsCertificationReport, GlobalOperationsCertifiedState, ModulePassStatus } from "./types.js";

export class GlobalOperationsCertified {
  private initializedAt: string | null = null;
  private latest: CertificationRunReport | null = null;
  private reports: GlobalOperationsCertificationReport[] = [];
  private record: CertificationEngineRecord | null = null;
  private readonly configuration: GlobalOperationsCertifiedConfiguration;
  private readonly coordinator = new GlobalModuleValidationCoordinator();
  constructor(private readonly bootstrap: EmpireBootstrapContext, private readonly dependencies: GlobalOperationsCertifiedDependencies, options: { configuration?: Partial<GlobalOperationsCertifiedConfiguration> } = {}) {
    this.configuration = buildGlobalOperationsCertifiedConfiguration(bootstrap.repositoryRoot, options.configuration);
  }
  async initialize(): Promise<GlobalOperationsCertifiedState> {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(GLOBAL_OPERATIONS_CERTIFIED_SYSTEM_PATH);
    if (!doc?.includes("Global Operations Certified")) throw new Error(`${GLOBAL_OPERATIONS_CERTIFIED_SYSTEM_PATH} missing — requires X4-19 system doc.`);
    this.initializedAt = new Date().toISOString(); appendGocLog({ event: "initialize", details: "X4-19 initialized in structural signals only mode" }); return this.getState();
  }
  private dependencyPresence(): CertificationEngineRecord["dependencyPresence"] {
    return Object.fromEntries(CERTIFIED_MODULE_IDS.map((id) => [id, Boolean(this.dependencies[id])])) as CertificationEngineRecord["dependencyPresence"];
  }
  private engineRecord(): CertificationEngineRecord {
    return this.record ?? (this.record = { engineRecordId: `goc-eng-${Date.now()}`, timestamp: new Date().toISOString(), engineId: GLOBAL_OPERATIONS_CERTIFIED_ID, engineVersion: "PILLOW-GOC-001", dependencyPresence: this.dependencyPresence(), metadataVersion: GOC_METADATA_VERSION });
  }
  connectGlobalOperationsCertified(): CertificationRunReport { return this.run("connect", true); }
  validateGlobalFramework(input: CertificationActionInput = {}): CertificationRunReport { return this.run("validate_all_modules", input.validated !== false); }
  validateAllModules(input: CertificationActionInput = {}): CertificationRunReport { return this.validateGlobalFramework(input); }
  validateCrossModuleIntegration(input: CertificationActionInput = {}): CertificationRunReport { return this.run("validate_cross_module", input.validated !== false); }
  validateEndToEndGlobalWorkflow(input: CertificationActionInput = {}): CertificationRunReport { return this.run("validate_end_to_end", input.validated !== false); }
  validateExecutiveGovernance(input: CertificationActionInput = {}): CertificationRunReport { return this.run("validate_executive_governance", input.validated !== false); }
  generateCertificationReport(input: CertificationActionInput = {}): CertificationRunReport { return this.run("generate_certification_report", input.validated !== false); }
  runDiagnostics(input: CertificationActionInput = {}): CertificationRunReport { return this.run("diagnostics", input.validated !== false); }
  private run(action: CertificationRunReport["action"], validated: boolean): CertificationRunReport {
    const started = Date.now(); const results = this.coordinator.validateAll(this.dependencies);
    const present = results.filter((r) => r.status === "pass").length; const allPass = present === CERTIFIED_MODULE_IDS.length;
    const special: ModulePassStatus = validated && allPass ? "pass" : validated ? "fail" : "fail";
    const readiness = Math.round((present / CERTIFIED_MODULE_IDS.length) * 100);
    const report: GlobalOperationsCertificationReport = {
      certificationId: `goc-cert-${Date.now()}`, timestamp: new Date().toISOString(), validationResultsX401ToX418: results,
      crossModuleIntegrationResult: special, endToEndGlobalWorkflowResult: special, executiveGovernanceResult: special,
      overallGlobalReadinessScore: readiness, warnings: results.filter((r) => r.status !== "pass").map((r) => `${r.moduleId}: ${r.notes}`),
      errors: validated ? [] : ["Certification requires validated=true"], overallCertificationStatus: validated && allPass ? "certified" : present ? "partial" : "failed",
      evidenceReferences: results.map((r) => r.evidenceReference).join(","), metadataVersion: GOC_METADATA_VERSION,
      structuralSignalsOnly: true, modifiedProductionSystemsWithoutSafeTestMode: false,
    };
    if (action === "generate_certification_report" || action === "validate_all_modules") this.reports.push(report);
    const decision = !validated || !present ? "fail" : allPass ? "pass" : "partial";
    const run: CertificationRunReport = { certificationRunReportId: `goc-run-${Date.now()}`, runTimestamp: new Date().toISOString(), action, engineRecord: this.engineRecord(), certificationReports: [report], validation: { decision, errors: report.errors, warnings: report.warnings, durationMs: Date.now() - started, metadataVersion: GOC_METADATA_VERSION }, durationMs: Date.now() - started, metadataVersion: GOC_METADATA_VERSION };
    this.latest = run; appendGocLog({ event: action, details: `readiness=${readiness}; structural validation only` }); return run;
  }
  getState(): GlobalOperationsCertifiedState {
    if (!this.initializedAt) throw new Error("Global Operations Certified not initialized. Call initialize() first.");
    const score = this.latest?.certificationReports[0]?.overallGlobalReadinessScore ?? 50;
    return { engineVersion: "PILLOW-GOC-001", missionId: "X4-19", status: this.latest?.validation.decision === "fail" ? "degraded" : "active", initializedAt: this.initializedAt, configuration: this.configuration, latestReport: this.latest, engineRecord: this.record, health: { status: score >= 85 ? "healthy" : score ? "degraded" : "failed", healthScore: score, notes: ["Structural signals only; credentials and production systems are never accessed"] } };
  }
  getCertificationReports() { return [...this.reports]; } getEngineRecord() { return this.record; }
  validateForSupervisorSync() { const state = this.getState(); return { valid: state.health.status !== "failed", health: state.health.status === "healthy" ? "healthy" as const : "degraded" as const, readinessScore: state.health.healthScore, notes: state.health.notes }; }
  getCockpitSnapshot() { const state = this.getState(); return { engineStatus: state.status, healthStatus: state.health.status, overallGlobalReadinessScore: state.health.healthScore, totalCertificationReports: this.reports.length, recentLogs: getGocLogs(8).map((log) => `${log.event}: ${log.details}`) }; }
}
export function createGlobalOperationsCertified(bootstrap: EmpireBootstrapContext, dependencies: GlobalOperationsCertifiedDependencies, options?: { configuration?: Partial<GlobalOperationsCertifiedConfiguration> }) { return new GlobalOperationsCertified(bootstrap, dependencies, options); }
export function resetGlobalOperationsCertifiedForTesting() { resetGocLogsForTesting(); }
