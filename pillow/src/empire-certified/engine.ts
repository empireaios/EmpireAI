import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildEmpireCertifiedConfiguration, type EmpireCertifiedConfiguration } from "./configuration.js";
import type { EmpireCertifiedDependencies } from "./dependencies.js";
import { ProgrammeValidationCoordinator } from "./module-validators.js";
import { CrossProgrammeIntegrationValidator } from "./cross-programme-integration-validator.js";
import { ConstitutionalGovernanceValidator } from "./constitutional-governance-validator.js";
import { EnterpriseIntelligenceValidator } from "./enterprise-intelligence-validator.js";
import { EndToEndWorkflowValidator } from "./end-to-end-workflow-validator.js";
import { ExecutiveGovernanceValidator } from "./executive-governance-validator.js";
import { CertificationValidator } from "./certification-validator.js";
import { CertificationMetadataGenerator } from "./certification-metadata-generator.js";
import { CertificationReportGenerator } from "./certification-report-generator.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { appendEcLog, getEcLogs, resetEcLogsForTesting } from "./ec-logging.js";
import {
  CERTIFIED_MODULE_IDS,
  CERTIFIED_PROGRAMME_IDS,
  EC_METADATA_VERSION,
  EMPIRE_CERTIFIED_ID,
  EMPIRE_CERTIFIED_SYSTEM_PATH,
  PROGRAMME_ANCHOR_IDS,
} from "./paths.js";
import type {
  CertificationActionInput,
  CertificationEngineRecord,
  CertificationRunReport,
  CertifiedDependencyId,
  EmpireCertificationReport,
  EmpireCertifiedState,
  ModulePassStatus,
} from "./types.js";

const ALL_DEPENDENCY_IDS = [...PROGRAMME_ANCHOR_IDS, ...CERTIFIED_MODULE_IDS] as CertifiedDependencyId[];

export class EmpireCertified {
  private initializedAt: string | null = null;
  private latest: CertificationRunReport | null = null;
  private reports: EmpireCertificationReport[] = [];
  private record: CertificationEngineRecord | null = null;
  private readonly configuration: EmpireCertifiedConfiguration;
  private readonly moduleCoordinator = new ProgrammeValidationCoordinator();
  private readonly programmeValidator = new CrossProgrammeIntegrationValidator();
  private readonly constitutionalValidator = new ConstitutionalGovernanceValidator();
  private readonly enterpriseIntelligenceValidator = new EnterpriseIntelligenceValidator();
  private readonly endToEndValidator = new EndToEndWorkflowValidator();
  private readonly executiveGovernanceValidator = new ExecutiveGovernanceValidator();
  private readonly certificationValidator = new CertificationValidator();
  private readonly metadataGenerator = new CertificationMetadataGenerator();
  private readonly reportGenerator = new CertificationReportGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    private readonly dependencies: EmpireCertifiedDependencies,
    options: { configuration?: Partial<EmpireCertifiedConfiguration> } = {},
  ) {
    this.configuration = buildEmpireCertifiedConfiguration(bootstrap.repositoryRoot, options.configuration);
  }

  async initialize(): Promise<EmpireCertifiedState> {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(EMPIRE_CERTIFIED_SYSTEM_PATH);
    if (!doc?.includes("Empire Certified")) {
      throw new Error(`${EMPIRE_CERTIFIED_SYSTEM_PATH} missing — requires X5-20 system doc.`);
    }
    this.initializedAt = new Date().toISOString();
    appendEcLog({ event: "certification_start", details: "X5-20 Empire Certified initialized in structural signals only mode" });
    return this.getState();
  }

  private dependencyPresence(): CertificationEngineRecord["dependencyPresence"] {
    return Object.fromEntries(ALL_DEPENDENCY_IDS.map((id) => [id, Boolean(this.dependencies[id])])) as CertificationEngineRecord["dependencyPresence"];
  }

  private engineRecord(): CertificationEngineRecord {
    return (
      this.record ??
      (this.record = {
        engineRecordId: `ec-eng-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: EMPIRE_CERTIFIED_ID,
        engineVersion: "PILLOW-EC-001",
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: EC_METADATA_VERSION,
      })
    );
  }

  connectEmpireCertified(): CertificationRunReport {
    return this.run("connect", true);
  }

  validateAllProgrammes(input: CertificationActionInput = {}): CertificationRunReport {
    return this.run("validate_programmes", input.validated !== false);
  }

  validateCompanyFactory(input: CertificationActionInput = {}): CertificationRunReport {
    return this.validateAllProgrammes(input);
  }

  validatePortfolioIntelligence(input: CertificationActionInput = {}): CertificationRunReport {
    return this.validateAllProgrammes(input);
  }

  validateAutonomousScaling(input: CertificationActionInput = {}): CertificationRunReport {
    return this.validateAllProgrammes(input);
  }

  validateGlobalExpansion(input: CertificationActionInput = {}): CertificationRunReport {
    return this.validateAllProgrammes(input);
  }

  validateEmpireIntelligence(input: CertificationActionInput = {}): CertificationRunReport {
    return this.validateAllProgrammes(input);
  }

  validateCrossProgrammeIntegration(input: CertificationActionInput = {}): CertificationRunReport {
    return this.run("validate_cross_programme", input.validated !== false);
  }

  validateEndToEndEnterpriseWorkflow(input: CertificationActionInput = {}): CertificationRunReport {
    return this.run("validate_end_to_end", input.validated !== false);
  }

  validateConstitutionalGovernance(input: CertificationActionInput = {}): CertificationRunReport {
    return this.run("validate_constitutional_governance", input.validated !== false);
  }

  validateEnterpriseIntelligenceCapability(input: CertificationActionInput = {}): CertificationRunReport {
    return this.run("validate_enterprise_intelligence", input.validated !== false);
  }

  validateExecutiveGovernance(input: CertificationActionInput = {}): CertificationRunReport {
    return this.run("validate_executive_governance", input.validated !== false);
  }

  generateCertificationReport(input: CertificationActionInput = {}): CertificationRunReport {
    return this.run("generate_certification_report", input.validated !== false);
  }

  runDiagnostics(input: CertificationActionInput = {}): CertificationRunReport {
    return this.run("diagnostics", input.validated !== false);
  }

  private run(action: CertificationRunReport["action"], validated: boolean): CertificationRunReport {
    const started = Date.now();
    const inputCheck = this.certificationValidator.validateInput(validated);
    const moduleResults = this.moduleCoordinator.validateEmpireModules(this.dependencies);
    const programmeResults = this.programmeValidator.validateProgrammes(this.dependencies, moduleResults);
    const modulesPass = moduleResults.every((r) => r.status === "pass");
    const programmesPass = programmeResults.every((r) => r.status === "pass");
    const presentModules = moduleResults.filter((r) => r.status === "pass").length;
    const presentProgrammes = programmeResults.filter((r) => r.status === "pass").length;

    const crossProgramme: ModulePassStatus = validated
      ? this.programmeValidator.validateIntegration(programmeResults)
      : "fail";
    const constitutional: ModulePassStatus = this.constitutionalValidator.validate(programmeResults, validated);
    const enterpriseIntelligence: ModulePassStatus = this.enterpriseIntelligenceValidator.validate(moduleResults, validated);
    const endToEnd: ModulePassStatus = this.endToEndValidator.validate(programmeResults, validated);
    const executiveGovernance: ModulePassStatus = this.executiveGovernanceValidator.validate(programmeResults, validated);
    const enterpriseHealth: ModulePassStatus = validated && modulesPass && programmesPass ? "pass" : "fail";

    const readiness = Math.round(
      ((presentModules / CERTIFIED_MODULE_IDS.length) * 0.6 + (presentProgrammes / CERTIFIED_PROGRAMME_IDS.length) * 0.4) * 100,
    );

    const warnings = [
      ...moduleResults.filter((r) => r.status !== "pass").map((r) => `${r.moduleId}: ${r.notes}`),
      ...programmeResults.filter((r) => r.status !== "pass").map((r) => `${r.programmeId}: ${r.notes}`),
    ];
    const errors = inputCheck.errors;

    const certified = validated && modulesPass && programmesPass
      && crossProgramme === "pass"
      && constitutional === "pass"
      && enterpriseIntelligence === "pass"
      && endToEnd === "pass"
      && executiveGovernance === "pass";

    const report: EmpireCertificationReport = {
      certificationId: `ec-cert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      validationResultsX1ThroughX5: programmeResults,
      validationResultsEmpireIntelligenceModules: moduleResults,
      crossProgrammeIntegrationStatus: crossProgramme,
      constitutionalGovernanceStatus: constitutional,
      enterpriseIntelligenceStatus: enterpriseIntelligence,
      endToEndWorkflowStatus: endToEnd,
      executiveGovernanceStatus: executiveGovernance,
      enterpriseHealthStatus: enterpriseHealth,
      overallReadinessScore: readiness,
      warnings,
      errors,
      certificationStatus: certified ? "certified" : presentModules || presentProgrammes ? "partial" : "failed",
      evidenceReferences: [
        ...moduleResults.map((r) => r.evidenceReference),
        ...programmeResults.map((r) => r.evidenceReference),
        this.metadataGenerator.generate().metadataVersion,
      ].join(","),
      metadataVersion: EC_METADATA_VERSION,
      structuralSignalsOnly: true,
      modifiedProductionSystemsWithoutSafeTestMode: false,
    };

    if (action === "generate_certification_report" || action === "validate_programmes") {
      this.reports.push(report);
    }

    if (!certified && validated) {
      this.recoveryManager.recordFailure();
      appendEcLog({ event: "recovery_attempt", details: `recovery after ${action}; production unmodified` });
    } else if (certified) {
      this.recoveryManager.reset();
    }

    const decision: CertificationRunReport["validation"]["decision"] =
      !validated || (!presentModules && !presentProgrammes) ? "fail" : certified ? "pass" : "partial";

    const run: CertificationRunReport = {
      certificationRunReportId: `ec-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.engineRecord(),
      certificationReports: [report],
      validation: {
        decision,
        errors: report.errors,
        warnings: report.warnings,
        durationMs: Date.now() - started,
        metadataVersion: EC_METADATA_VERSION,
      },
      durationMs: Date.now() - started,
      metadataVersion: EC_METADATA_VERSION,
    };

    this.latest = run;
    const logEvent =
      action === "connect" ? "certification_start"
        : action === "validate_programmes" ? "programme_validation"
          : action === "validate_cross_programme" ? "cross_programme_validation"
            : action === "validate_constitutional_governance" ? "constitutional_validation"
              : action === "validate_end_to_end" ? "end_to_end_validation"
                : action === "generate_certification_report" ? "certification_completion"
                  : action === "diagnostics" ? "health_information"
                    : action;
    appendEcLog({
      event: logEvent,
      details: `${this.reportGenerator.summarize(report)}; durationMs=${run.durationMs}; healthScore=${readiness}`,
    });
    if (decision === "fail") {
      appendEcLog({ event: "validation_failure", details: `action=${action}; errors=${errors.join("|") || "none"}` });
    }
    return run;
  }

  getState(): EmpireCertifiedState {
    if (!this.initializedAt) throw new Error("Empire Certified not initialized. Call initialize() first.");
    const score = this.latest?.certificationReports[0]?.overallReadinessScore ?? 50;
    return {
      engineVersion: "PILLOW-EC-001",
      missionId: "X5-20",
      status: this.latest?.validation.decision === "fail" ? "degraded" : "active",
      initializedAt: this.initializedAt,
      configuration: this.configuration,
      latestReport: this.latest,
      engineRecord: this.record,
      health: {
        status: this.healthMonitor.status(score),
        healthScore: score,
        notes: ["Structural signals only; credentials and production systems are never accessed"],
      },
    };
  }

  getCertificationReports() {
    return [...this.reports];
  }

  getEngineRecord() {
    return this.record;
  }

  validateForSupervisorSync() {
    const state = this.getState();
    return {
      valid: state.health.status !== "failed",
      health: state.health.status === "healthy" ? ("healthy" as const) : ("degraded" as const),
      readinessScore: state.health.healthScore,
      notes: state.health.notes,
    };
  }

  getCockpitSnapshot() {
    const state = this.getState();
    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      overallReadinessScore: state.health.healthScore,
      totalCertificationReports: this.reports.length,
      recentLogs: getEcLogs(8).map((log) => `${log.event}: ${log.details}`),
    };
  }
}

export function createEmpireCertified(
  bootstrap: EmpireBootstrapContext,
  dependencies: EmpireCertifiedDependencies,
  options?: { configuration?: Partial<EmpireCertifiedConfiguration> },
) {
  return new EmpireCertified(bootstrap, dependencies, options);
}

export function resetEmpireCertifiedForTesting() {
  resetEcLogsForTesting();
}
