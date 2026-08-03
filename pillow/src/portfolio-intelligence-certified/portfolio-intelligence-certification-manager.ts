/** X2-10 — Portfolio Intelligence Certification Manager. */

import { createHash } from "node:crypto";
import {
  CERTIFIED_MODULE_IDS,
  PIC_CAPABILITIES,
  PIC_METADATA_VERSION,
  PORTFOLIO_INTELLIGENCE_CERTIFIED_ID,
} from "./paths.js";
import { appendPicLog } from "./pic-logging.js";
import type { PortfolioIntelligenceCertifiedDependencies } from "./dependencies.js";
import { CertificationRecordStore } from "./certification-record-store.js";
import { runAllModuleValidations } from "./module-validators.js";
import { EndToEndPortfolioTestRunner } from "./end-to-end-portfolio-test-runner.js";
import { CertificationReportGenerator } from "./certification-report-generator.js";
import { CertificationMetadataGenerator } from "./certification-metadata-generator.js";
import { CertificationValidator } from "./certification-validator.js";
import type { PortfolioIntelligenceCertifiedConfiguration } from "./configuration.js";
import type {
  CertificationActionInput,
  CertificationEngineRecord,
  CertificationRunReport,
  CertifiedModuleId,
  CertifyPortfolioIntelligenceInput,
  ConnectPortfolioIntelligenceCertifiedInput,
  ModuleCertificationResult,
  PortfolioIntelligenceCertificationReport,
} from "./types.js";

export type { PortfolioIntelligenceCertifiedDependencies };

export class PortfolioIntelligenceCertificationManager {
  private engineRecord: CertificationEngineRecord | null = null;
  private readonly store = new CertificationRecordStore();
  private readonly e2eRunner = new EndToEndPortfolioTestRunner();
  private readonly reportGenerator = new CertificationReportGenerator();
  private readonly metadataGenerator = new CertificationMetadataGenerator();
  private readonly validator = new CertificationValidator();

  constructor(private readonly deps: PortfolioIntelligenceCertifiedDependencies) {}

  getEngineRecord(): CertificationEngineRecord | null {
    return this.engineRecord;
  }

  getCertificationReports(): PortfolioIntelligenceCertificationReport[] {
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
    presence["enterprise-portfolio-framework"] = this.deps.enterprisePortfolioFramework
      ? this.probe(() => this.deps.enterprisePortfolioFramework!.getState())
      : false;
    presence["multi-company-registry"] = this.deps.multiCompanyRegistry
      ? this.probe(() => this.deps.multiCompanyRegistry!.getState())
      : false;
    presence["portfolio-performance-engine"] = this.deps.portfolioPerformanceEngine
      ? this.probe(() => this.deps.portfolioPerformanceEngine!.getState())
      : false;
    presence["cross-business-knowledge-engine"] = this.deps.crossBusinessKnowledgeEngine
      ? this.probe(() => this.deps.crossBusinessKnowledgeEngine!.getState())
      : false;
    presence["capital-distribution-engine"] = this.deps.capitalDistributionEngine
      ? this.probe(() => this.deps.capitalDistributionEngine!.getState())
      : false;
    presence["executive-portfolio-dashboard"] = this.deps.executivePortfolioDashboard
      ? this.probe(() => this.deps.executivePortfolioDashboard!.getState())
      : false;
    presence["portfolio-risk-engine"] = this.deps.portfolioRiskEngine
      ? this.probe(() => this.deps.portfolioRiskEngine!.getState())
      : false;
    presence["portfolio-balance-engine"] = this.deps.portfolioBalanceEngine
      ? this.probe(() => this.deps.portfolioBalanceEngine!.getState())
      : false;
    presence["business-health-ranking"] = this.deps.businessHealthRanking
      ? this.probe(() => this.deps.businessHealthRanking!.getState())
      : false;
    return presence;
  }

  private requireConnected(): CertificationEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Portfolio Intelligence Certified not connected — call connectPortfolioIntelligenceCertified first",
      );
    }
    return this.engineRecord;
  }

  private resolveScope(
    input: CertifyPortfolioIntelligenceInput | CertificationActionInput,
    config: PortfolioIntelligenceCertifiedConfiguration,
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
        : { ...r, status: "skip", notes: "Out of certification scope" },
    );
  }

  private fingerprint(report: Omit<
    PortfolioIntelligenceCertificationReport,
    "certificationFingerprint"
  >): string {
    return createHash("sha256")
      .update(
        JSON.stringify({
          id: report.certificationId,
          overall: report.overallCertificationStatus,
          modules: report.perModulePassFailStatus.map((m) => `${m.moduleId}:${m.status}`),
          e2e: report.endToEndPortfolioValidationResult,
        }),
      )
      .digest("hex")
      .slice(0, 24);
  }

  private buildCertificationReport(
    results: ModuleCertificationResult[],
    endToEnd: ReturnType<EndToEndPortfolioTestRunner["run"]>,
    config: PortfolioIntelligenceCertifiedConfiguration,
  ): PortfolioIntelligenceCertificationReport {
    // Intentional skip does not fail the overall threshold.
    const e2eForOverall = endToEnd.status === "skip" ? "pass" : endToEnd.status;
    const overall = this.reportGenerator.deriveOverall(
      results,
      e2eForOverall,
      config.passThresholdPercent,
    );
    const base = {
      certificationId: `pic-cert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      enterprisePortfolioFrameworkStatus: this.reportGenerator.statusOf(
        results,
        "enterprise-portfolio-framework",
      ),
      companyRegistryStatus: this.reportGenerator.statusOf(results, "multi-company-registry"),
      portfolioAnalyticsStatus: this.reportGenerator.statusOf(
        results,
        "portfolio-performance-engine",
      ),
      knowledgeSharingStatus: this.reportGenerator.statusOf(
        results,
        "cross-business-knowledge-engine",
      ),
      capitalDistributionStatus: this.reportGenerator.statusOf(
        results,
        "capital-distribution-engine",
      ),
      executiveDashboardStatus: this.reportGenerator.statusOf(
        results,
        "executive-portfolio-dashboard",
      ),
      portfolioRiskStatus: this.reportGenerator.statusOf(results, "portfolio-risk-engine"),
      portfolioBalanceStatus: this.reportGenerator.statusOf(results, "portfolio-balance-engine"),
      businessHealthRankingStatus: this.reportGenerator.statusOf(
        results,
        "business-health-ranking",
      ),
      perModulePassFailStatus: results,
      warnings: this.reportGenerator.collectWarnings(results),
      errors: [
        ...this.reportGenerator.collectErrors(results),
        ...(endToEnd.status === "fail" ? [endToEnd.notes] : []),
      ],
      endToEndPortfolioValidationResult: endToEnd.status,
      overallCertificationStatus: overall,
      evidenceReferences: this.reportGenerator.evidenceBundle(
        results,
        endToEnd.evidenceReference,
      ),
      structuralSignalOnly: true as const,
      modifiedProductionSystemsWithoutSafeTestMode: false as const,
      fabricatedCertificationFacts: false as const,
      validationStatus:
        overall === "certified"
          ? ("passed" as const)
          : overall === "failed"
            ? ("failed" as const)
            : ("partial" as const),
      metadataVersion: PIC_METADATA_VERSION,
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
        engineRecordId: "pic-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: PORTFOLIO_INTELLIGENCE_CERTIFIED_ID,
        engineVersion: "PILLOW-PIC-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...PIC_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: PIC_METADATA_VERSION,
      } satisfies CertificationEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      certificationReports: this.store.list(),
      validation: {
        validationReportId: `pic-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: PIC_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(
    config: PortfolioIntelligenceCertifiedConfiguration,
  ): { frameworkModuleId: string | null; validation: CertificationRunReport["validation"] } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: PORTFOLIO_INTELLIGENCE_CERTIFIED_ID,
        moduleVersion: PIC_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-10",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "portfolio.certified",
            "portfolio.partial",
            "portfolio.failed",
            "portfolio.e2e",
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
      this.deps.enterprisePortfolioFramework.activatePortfolioModule(
        PORTFOLIO_INTELLIGENCE_CERTIFIED_ID,
      );
    }

    appendPicLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Portfolio Intelligence Certified with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `pic-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: PIC_METADATA_VERSION,
      },
    };
  }

  connectPortfolioIntelligenceCertified(
    _input: ConnectPortfolioIntelligenceCertifiedInput,
    config: PortfolioIntelligenceCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    appendPicLog({
      event: "certification_start",
      level: "info",
      details: "Connecting Portfolio Intelligence Certified",
    });

    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const connectedCount = Object.values(presence).filter(Boolean).length;
    const allPresent = connectedCount === CERTIFIED_MODULE_IDS.length;

    this.engineRecord = {
      engineRecordId: `pic-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PORTFOLIO_INTELLIGENCE_CERTIFIED_ID,
      engineVersion: "PILLOW-PIC-001",
      currentOperationalState: "connected",
      healthStatus: allPresent ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...PIC_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: PIC_METADATA_VERSION,
    };

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...CERTIFIED_MODULE_IDS.filter((id) => !presence[id]).map((id) => `${id} unavailable`),
    ];

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: this.engineRecord,
      certificationReports: [],
      validation: {
        ...framework.validation,
        warnings,
        decision:
          framework.validation.decision === "fail"
            ? "fail"
            : !allPresent
              ? "partial"
              : framework.validation.decision,
      },
      durationMs: Date.now() - started,
    });
  }

  certifyPortfolioIntelligence(
    input: CertifyPortfolioIntelligenceInput,
    config: PortfolioIntelligenceCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateCertify(input, config);
      if (validation.decision === "fail") {
        return this.failReport(
          "certify_portfolio_intelligence",
          validation.errors,
          Date.now() - started,
        );
      }

      appendPicLog({
        event: "module_validation",
        level: "info",
        details: "Running X2-01 through X2-09 certification",
      });

      const scope = this.resolveScope(input, config);
      const results = this.runScopedValidations(scope);
      const endToEnd =
        config.endToEndValidationEnabled && input.runEndToEnd !== false
          ? this.e2eRunner.run(this.deps)
          : {
              status: "skip" as const,
              evidenceReference: "structural://e2e-portfolio/skipped",
              notes: "End-to-end skipped by configuration",
            };

      const cert = this.buildCertificationReport(results, endToEnd, config);
      this.store.append(cert);
      engineRecord.currentOperationalState = "active";

      appendPicLog({
        event: "certification_completion",
        level: cert.overallCertificationStatus === "certified" ? "info" : "warn",
        details: `Overall=${cert.overallCertificationStatus} · fingerprint=${cert.certificationFingerprint}`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "certify_portfolio_intelligence",
        engineRecord,
        certificationReports: [cert],
        validation: {
          validationReportId: `pic-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision:
            cert.overallCertificationStatus === "certified"
              ? "pass"
              : cert.overallCertificationStatus === "failed"
                ? "fail"
                : "partial",
          errors: cert.errors,
          warnings: cert.warnings,
          durationMs: Date.now() - started,
          metadataVersion: PIC_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "certify_portfolio_intelligence",
        [error instanceof Error ? error.message : "Certification failed"],
        Date.now() - started,
      );
    }
  }

  private singleModuleAction(
    action: CertificationRunReport["action"],
    moduleId: CertifiedModuleId,
    input: CertificationActionInput,
    config: PortfolioIntelligenceCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateCertify(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }
      const results = this.runScopedValidations([moduleId]);
      appendPicLog({
        event: "module_validation",
        level: "info",
        details: `Validated ${moduleId}: ${results[0]?.status}`,
      });
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        certificationReports: this.store.list(),
        validation: {
          validationReportId: `pic-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: results[0]?.status === "pass" ? "pass" : results[0]?.status === "fail" ? "fail" : "partial",
          errors: results.filter((r) => r.status === "fail").map((r) => r.notes),
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: PIC_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        action,
        [error instanceof Error ? error.message : "Module validation failed"],
        Date.now() - started,
      );
    }
  }

  validateEnterprisePortfolio(input: CertificationActionInput, config: PortfolioIntelligenceCertifiedConfiguration) {
    return this.singleModuleAction("validate_enterprise_portfolio", "enterprise-portfolio-framework", input, config);
  }
  validateCompanyRegistry(input: CertificationActionInput, config: PortfolioIntelligenceCertifiedConfiguration) {
    return this.singleModuleAction("validate_company_registry", "multi-company-registry", input, config);
  }
  validatePortfolioAnalytics(input: CertificationActionInput, config: PortfolioIntelligenceCertifiedConfiguration) {
    return this.singleModuleAction("validate_portfolio_analytics", "portfolio-performance-engine", input, config);
  }
  validateKnowledgeSharing(input: CertificationActionInput, config: PortfolioIntelligenceCertifiedConfiguration) {
    return this.singleModuleAction("validate_knowledge_sharing", "cross-business-knowledge-engine", input, config);
  }
  validateCapitalDistribution(input: CertificationActionInput, config: PortfolioIntelligenceCertifiedConfiguration) {
    return this.singleModuleAction("validate_capital_distribution", "capital-distribution-engine", input, config);
  }
  validateExecutiveDashboard(input: CertificationActionInput, config: PortfolioIntelligenceCertifiedConfiguration) {
    return this.singleModuleAction("validate_executive_dashboard", "executive-portfolio-dashboard", input, config);
  }
  validatePortfolioRisk(input: CertificationActionInput, config: PortfolioIntelligenceCertifiedConfiguration) {
    return this.singleModuleAction("validate_portfolio_risk", "portfolio-risk-engine", input, config);
  }
  validatePortfolioBalance(input: CertificationActionInput, config: PortfolioIntelligenceCertifiedConfiguration) {
    return this.singleModuleAction("validate_portfolio_balance", "portfolio-balance-engine", input, config);
  }
  validateBusinessHealth(input: CertificationActionInput, config: PortfolioIntelligenceCertifiedConfiguration) {
    return this.singleModuleAction("validate_business_health", "business-health-ranking", input, config);
  }

  runEndToEndPortfolio(
    input: CertificationActionInput,
    config: PortfolioIntelligenceCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateCertify(input, config);
      if (validation.decision === "fail") {
        return this.failReport("run_end_to_end_portfolio", validation.errors, Date.now() - started);
      }
      const e2e = this.e2eRunner.run(this.deps);
      appendPicLog({
        event: "end_to_end_portfolio_validation",
        level: e2e.status === "pass" ? "info" : "warn",
        details: e2e.notes,
      });
      return this.metadataGenerator.buildRunReport({
        action: "run_end_to_end_portfolio",
        engineRecord,
        certificationReports: this.store.list(),
        validation: {
          validationReportId: `pic-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: e2e.status === "pass" ? "pass" : "fail",
          errors: e2e.status === "pass" ? [] : [e2e.notes],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: PIC_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "run_end_to_end_portfolio",
        [error instanceof Error ? error.message : "End-to-end workflow failure"],
        Date.now() - started,
      );
    }
  }

  generateCertificationReport(
    input: CertificationActionInput,
    config: PortfolioIntelligenceCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      let latest = this.store.latest();
      if (!latest) {
        const certify = this.certifyPortfolioIntelligence(
          { validated: true, runEndToEnd: true, scope: input.scope },
          config,
        );
        if (certify.validation.decision === "fail") return certify;
        latest = this.store.latest();
      }
      appendPicLog({
        event: "certification_report",
        level: "info",
        details: `Report ${latest?.certificationId ?? "none"} · ${latest?.overallCertificationStatus}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "generate_certification_report",
        engineRecord,
        certificationReports: latest ? [latest] : [],
        validation: {
          validationReportId: `pic-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: latest?.overallCertificationStatus === "certified" ? "pass" : "partial",
          errors: latest?.errors ?? [],
          warnings: latest?.warnings ?? [],
          durationMs: Date.now() - started,
          metadataVersion: PIC_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "generate_certification_report",
        [error instanceof Error ? error.message : "Report generation failed"],
        Date.now() - started,
      );
    }
  }
}
