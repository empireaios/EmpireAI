/** X2-21 — Portfolio Certification Manager. */

import { createHash } from "node:crypto";
import {
  CERTIFIED_MODULE_IDS,
  PORTFOLIO_CERTIFIED_ID,
  PTC_CAPABILITIES,
  PTC_METADATA_VERSION,
} from "./paths.js";
import { appendPtcLog } from "./ptc-logging.js";
import type { PortfolioCertifiedDependencies } from "./dependencies.js";
import { CertificationRecordStore } from "./certification-record-store.js";
import { runAllModuleValidations } from "./module-validators.js";
import { CrossModuleIntegrationValidator } from "./cross-module-integration-validator.js";
import { EndToEndPortfolioWorkflowValidator } from "./end-to-end-portfolio-workflow-validator.js";
import { ExecutiveGovernanceValidator } from "./executive-governance-validator.js";
import { CertificationReportGenerator } from "./certification-report-generator.js";
import { CertificationMetadataGenerator } from "./certification-metadata-generator.js";
import { CertificationValidator } from "./certification-validator.js";
import type { PortfolioCertifiedConfiguration } from "./configuration.js";
import type {
  CertificationActionInput,
  CertificationEngineRecord,
  CertificationRunReport,
  CertifiedModuleId,
  CertifyPortfolioInput,
  ConnectPortfolioCertifiedInput,
  ModuleCertificationResult,
  ModulePassStatus,
  PortfolioCertificationReport,
} from "./types.js";

export type { PortfolioCertifiedDependencies };

export class PortfolioCertificationManager {
  private engineRecord: CertificationEngineRecord | null = null;
  private readonly store = new CertificationRecordStore();
  private readonly crossModule = new CrossModuleIntegrationValidator();
  private readonly e2eRunner = new EndToEndPortfolioWorkflowValidator();
  private readonly governance = new ExecutiveGovernanceValidator();
  private readonly reportGenerator = new CertificationReportGenerator();
  private readonly metadataGenerator = new CertificationMetadataGenerator();
  private readonly validator = new CertificationValidator();

  constructor(private readonly deps: PortfolioCertifiedDependencies) {}

  getEngineRecord(): CertificationEngineRecord | null {
    return this.engineRecord;
  }

  getCertificationReports(): PortfolioCertificationReport[] {
    return this.store.list();
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.store.resetForTesting();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): CertificationEngineRecord["dependencyPresence"] {
    const presence = this.metadataGenerator.emptyDependencyPresence();
    const map: Array<[CertifiedModuleId, () => unknown]> = [
      ["enterprise-portfolio-framework", () => this.deps.enterprisePortfolioFramework?.getState()],
      ["multi-company-registry", () => this.deps.multiCompanyRegistry?.getState()],
      ["portfolio-performance-engine", () => this.deps.portfolioPerformanceEngine?.getState()],
      ["cross-business-knowledge-engine", () => this.deps.crossBusinessKnowledgeEngine?.getState()],
      ["capital-distribution-engine", () => this.deps.capitalDistributionEngine?.getState()],
      ["executive-portfolio-dashboard", () => this.deps.executivePortfolioDashboard?.getState()],
      ["portfolio-risk-engine", () => this.deps.portfolioRiskEngine?.getState()],
      ["portfolio-balance-engine", () => this.deps.portfolioBalanceEngine?.getState()],
      ["business-health-ranking", () => this.deps.businessHealthRanking?.getState()],
      ["portfolio-intelligence-certified", () => this.deps.portfolioIntelligenceCertified?.getState()],
      ["cross-company-resource-engine", () => this.deps.crossCompanyResourceEngine?.getState()],
      ["shared-customer-intelligence", () => this.deps.sharedCustomerIntelligence?.getState()],
      ["shared-supplier-intelligence", () => this.deps.sharedSupplierIntelligence?.getState()],
      ["portfolio-forecast-engine", () => this.deps.portfolioForecastEngine?.getState()],
      ["acquisition-evaluation-engine", () => this.deps.acquisitionEvaluationEngine?.getState()],
      ["portfolio-optimization-engine", () => this.deps.portfolioOptimizationEngine?.getState()],
      ["company-lifecycle-manager", () => this.deps.companyLifecycleManager?.getState()],
      ["portfolio-expansion-planner", () => this.deps.portfolioExpansionPlanner?.getState()],
      ["enterprise-value-engine", () => this.deps.enterpriseValueEngine?.getState()],
      ["autonomous-portfolio-board", () => this.deps.autonomousPortfolioBoard?.getState()],
    ];
    for (const [id, getter] of map) {
      presence[id] = this.probe(getter);
    }
    return presence;
  }

  private requireConnected(): CertificationEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Portfolio Certified not connected — call connectPortfolioCertified first",
      );
    }
    return this.engineRecord;
  }

  private resolveScope(
    input: CertifyPortfolioInput | CertificationActionInput,
    config: PortfolioCertifiedConfiguration,
  ): CertifiedModuleId[] {
    const requested = input.scope?.length
      ? input.scope
      : (config.certificationScope as CertifiedModuleId[]);
    return CERTIFIED_MODULE_IDS.filter((id) => requested.includes(id));
  }

  private runScopedValidations(scope: CertifiedModuleId[]): ModuleCertificationResult[] {
    return runAllModuleValidations(this.deps).map((r) =>
      scope.includes(r.moduleId)
        ? r
        : { ...r, status: "skip" as const, notes: "Out of certification scope" },
    );
  }

  private fingerprint(
    report: Omit<PortfolioCertificationReport, "certificationFingerprint">,
  ): string {
    return createHash("sha256")
      .update(
        JSON.stringify({
          id: report.certificationId,
          overall: report.overallCertificationStatus,
          modules: report.validationResultsX201ToX220.map((m) => `${m.moduleId}:${m.status}`),
          cross: report.crossModuleIntegrationResult,
          e2e: report.endToEndPortfolioWorkflowResult,
          gov: report.executiveGovernanceResult,
          score: report.overallPortfolioReadinessScore,
        }),
      )
      .digest("hex")
      .slice(0, 24);
  }

  private buildCertificationReport(
    results: ModuleCertificationResult[],
    crossModule: { status: ModulePassStatus; evidenceReference: string; notes: string },
    endToEnd: { status: ModulePassStatus; evidenceReference: string; notes: string },
    governance: { status: ModulePassStatus; evidenceReference: string; notes: string },
    config: PortfolioCertifiedConfiguration,
  ): PortfolioCertificationReport {
    const crossForOverall = crossModule.status === "skip" ? "pass" : crossModule.status;
    const e2eForOverall = endToEnd.status === "skip" ? "pass" : endToEnd.status;
    const govForOverall = governance.status === "skip" ? "pass" : governance.status;
    const overall = this.reportGenerator.deriveOverall(
      results,
      crossForOverall,
      e2eForOverall,
      govForOverall,
      config.passThresholdPercent,
    );
    const readiness = this.reportGenerator.readinessScore(
      results,
      crossModule.status,
      endToEnd.status,
      governance.status,
    );
    const base = {
      certificationId: `ptc-cert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      validationResultsX201ToX220: results,
      crossModuleIntegrationResult: crossModule.status,
      endToEndPortfolioWorkflowResult: endToEnd.status,
      executiveGovernanceResult: governance.status,
      overallPortfolioReadinessScore: readiness,
      warnings: [
        ...this.reportGenerator.collectWarnings(results),
        ...(crossModule.status === "fail" ? [crossModule.notes] : []),
        ...(governance.status === "fail" ? [governance.notes] : []),
      ],
      errors: [
        ...this.reportGenerator.collectErrors(results),
        ...(endToEnd.status === "fail" ? [endToEnd.notes] : []),
      ],
      overallCertificationStatus: overall,
      evidenceReferences: this.reportGenerator.evidenceBundle(results, [
        crossModule.evidenceReference,
        endToEnd.evidenceReference,
        governance.evidenceReference,
      ]),
      structuralSignalOnly: true as const,
      modifiedProductionSystemsWithoutSafeTestMode: false as const,
      fabricatedCertificationFacts: false as const,
      validationStatus:
        overall === "certified"
          ? ("passed" as const)
          : overall === "failed"
            ? ("failed" as const)
            : ("partial" as const),
      metadataVersion: PTC_METADATA_VERSION,
    };
    return {
      ...base,
      certificationFingerprint: this.fingerprint(base),
    };
  }

  private failReport(
    action: CertificationRunReport["action"],
    errors: string[],
    durationMs: number,
  ): CertificationRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "ptc-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: PORTFOLIO_CERTIFIED_ID,
        engineVersion: "PILLOW-PTC-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...PTC_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: PTC_METADATA_VERSION,
      } satisfies CertificationEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      certificationReports: this.store.list(),
      validation: {
        validationReportId: `ptc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: PTC_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: PortfolioCertifiedConfiguration): {
    frameworkModuleId: string | null;
    validation: CertificationRunReport["validation"];
  } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: PORTFOLIO_CERTIFIED_ID,
        moduleVersion: PTC_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-21",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "portfolio.programme.certified",
            "portfolio.programme.partial",
            "portfolio.programme.failed",
            "portfolio.programme.e2e",
          ],
          maxEventsPerMinute: 30,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "portfolio_module_registration",
          "portfolio_event_routing",
          "portfolio_validation",
          "diagnostics",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.enterprisePortfolioFramework.activatePortfolioModule(PORTFOLIO_CERTIFIED_ID);
    }

    appendPtcLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Portfolio Certified with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `ptc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: PTC_METADATA_VERSION,
      },
    };
  }

  connectPortfolioCertified(
    _input: ConnectPortfolioCertifiedInput,
    config: PortfolioCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const connectedCount = Object.values(presence).filter(Boolean).length;
    const corePresent =
      presence["enterprise-portfolio-framework"] && presence["multi-company-registry"];

    this.engineRecord = {
      engineRecordId: `ptc-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PORTFOLIO_CERTIFIED_ID,
      engineVersion: "PILLOW-PTC-001",
      currentOperationalState: "connected",
      healthStatus: corePresent ? (connectedCount >= 15 ? "healthy" : "degraded") : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...PTC_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: PTC_METADATA_VERSION,
    };

    appendPtcLog({
      event: "engine_connected",
      level: "info",
      details: "Portfolio Certified connected — safe test mode · production systems unmodified",
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: this.engineRecord,
      certificationReports: this.store.list(),
      validation: {
        ...framework.validation,
        warnings: [
          ...framework.validation.warnings,
          ...configValidation.warnings,
          ...Object.entries(presence)
            .filter(([, ok]) => !ok)
            .map(([key]) => `${key} unavailable`),
          "Safe test mode — certification does not modify production systems",
        ],
        decision:
          framework.validation.decision === "fail"
            ? "fail"
            : !corePresent
              ? "partial"
              : framework.validation.decision,
      },
      durationMs: Date.now() - started,
    });
  }

  certifyPortfolio(
    input: CertifyPortfolioInput,
    config: PortfolioCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateCertify(input, config);
      if (validation.decision === "fail") {
        return this.failReport("certify_portfolio", validation.errors, Date.now() - started);
      }

      appendPtcLog({
        event: "certification_start",
        level: "info",
        details: "Portfolio programme certification started (X2-01..X2-20)",
      });

      const scope = this.resolveScope(input, config);
      const results = this.runScopedValidations(scope);

      const crossModule =
        input.runCrossModule === false || !config.crossModuleValidationEnabled
          ? {
              status: "skip" as const,
              evidenceReference: "structural://cross-module/skipped",
              notes: "Cross-module validation skipped",
            }
          : this.crossModule.validate(this.deps);

      const endToEnd =
        input.runEndToEnd === false || !config.endToEndValidationEnabled
          ? {
              status: "skip" as const,
              evidenceReference: "structural://e2e/skipped",
              notes: "End-to-end validation skipped",
            }
          : this.e2eRunner.run(this.deps);

      const governance =
        input.runExecutiveGovernance === false || !config.executiveGovernanceValidationEnabled
          ? {
              status: "skip" as const,
              evidenceReference: "structural://governance/skipped",
              notes: "Executive governance validation skipped",
            }
          : this.governance.validate(this.deps);

      const cert = this.buildCertificationReport(
        results,
        crossModule,
        endToEnd,
        governance,
        config,
      );
      this.store.append(cert);

      appendPtcLog({
        event: "certification_completion",
        level: "info",
        details: `Portfolio certification ${cert.overallCertificationStatus} · readiness=${cert.overallPortfolioReadinessScore}`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "certify_portfolio",
        engineRecord,
        certificationReports: [cert],
        validation: {
          ...validation,
          decision:
            cert.overallCertificationStatus === "failed"
              ? "fail"
              : cert.overallCertificationStatus === "certified"
                ? "pass"
                : "partial",
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "certify_portfolio",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  validateCrossModule(
    input: CertificationActionInput,
    config: PortfolioCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateCertify(input, config);
      if (validation.decision === "fail") {
        return this.failReport("validate_cross_module", validation.errors, Date.now() - started);
      }
      const cross = this.crossModule.validate(this.deps);
      appendPtcLog({
        event: "cross_module_validation",
        level: "info",
        details: cross.notes,
      });
      return this.metadataGenerator.buildRunReport({
        action: "validate_cross_module",
        engineRecord,
        certificationReports: this.store.list(),
        validation: {
          ...validation,
          decision: cross.status === "pass" ? "pass" : "fail",
          errors: cross.status === "fail" ? [cross.notes] : [],
          warnings: [...validation.warnings, cross.evidenceReference],
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "validate_cross_module",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  validateEndToEnd(
    input: CertificationActionInput,
    config: PortfolioCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateCertify(input, config);
      if (validation.decision === "fail") {
        return this.failReport("validate_end_to_end", validation.errors, Date.now() - started);
      }
      const e2e = this.e2eRunner.run(this.deps);
      appendPtcLog({
        event: "end_to_end_portfolio_validation",
        level: "info",
        details: e2e.notes,
      });
      return this.metadataGenerator.buildRunReport({
        action: "validate_end_to_end",
        engineRecord,
        certificationReports: this.store.list(),
        validation: {
          ...validation,
          decision: e2e.status === "pass" ? "pass" : "fail",
          errors: e2e.status === "fail" ? [e2e.notes] : [],
          warnings: [...validation.warnings, e2e.evidenceReference],
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "validate_end_to_end",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  validateExecutiveGovernance(
    input: CertificationActionInput,
    config: PortfolioCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateCertify(input, config);
      if (validation.decision === "fail") {
        return this.failReport(
          "validate_executive_governance",
          validation.errors,
          Date.now() - started,
        );
      }
      const gov = this.governance.validate(this.deps);
      appendPtcLog({
        event: "executive_governance_validation",
        level: "info",
        details: gov.notes,
      });
      return this.metadataGenerator.buildRunReport({
        action: "validate_executive_governance",
        engineRecord,
        certificationReports: this.store.list(),
        validation: {
          ...validation,
          decision: gov.status === "pass" ? "pass" : "fail",
          errors: gov.status === "fail" ? [gov.notes] : [],
          warnings: [...validation.warnings, gov.evidenceReference],
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "validate_executive_governance",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  generateCertificationReport(
    input: CertificationActionInput,
    config: PortfolioCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateCertify(input, config);
      if (validation.decision === "fail") {
        return this.failReport(
          "generate_certification_report",
          validation.errors,
          Date.now() - started,
        );
      }
      const latest = this.store.latest();
      if (!latest) {
        return this.certifyPortfolio(
          { validated: input.validated ?? true, runEndToEnd: true },
          config,
        );
      }
      appendPtcLog({
        event: "certification_reporting",
        level: "info",
        details: `Report ${latest.certificationId} · ${latest.overallCertificationStatus}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "generate_certification_report",
        engineRecord,
        certificationReports: [latest],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "generate_certification_report",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  runDiagnostics(
    _input: CertificationActionInput,
    config: PortfolioCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "ptc-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: PORTFOLIO_CERTIFIED_ID,
        engineVersion: "PILLOW-PTC-001",
        currentOperationalState: "registered",
        healthStatus: "standby",
        validationStatus: "pending",
        supportedCapabilities: [...PTC_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: PTC_METADATA_VERSION,
      } satisfies CertificationEngineRecord);

    const configValidation = this.validator.validateConfiguration(config);
    appendPtcLog({
      event: "diagnostics",
      level: "info",
      details: "Portfolio Certified diagnostics complete",
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      certificationReports: this.store.list(),
      validation: {
        ...configValidation,
        warnings: [
          ...configValidation.warnings,
          "Diagnostics only — safe test mode",
        ],
        decision: configValidation.decision === "fail" ? "fail" : "pass",
      },
      durationMs: Date.now() - started,
    });
  }
}
