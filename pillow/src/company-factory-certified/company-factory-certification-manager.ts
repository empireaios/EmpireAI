/** X1-15 — Company Factory Certification Manager. */

import { createHash } from "node:crypto";
import {
  CERTIFIED_MODULE_IDS,
  CFC_METADATA_VERSION,
  COMPANY_FACTORY_CERTIFIED_ID,
} from "./paths.js";
import { appendCfcLog } from "./cfc-logging.js";
import type { CompanyFactoryCertifiedDependencies } from "./dependencies.js";
import { CertificationRecordStore } from "./certification-record-store.js";
import {
  BrandValidator,
  BusinessModelValidator,
  BusinessOpportunityValidator,
  CompanyFrameworkValidator,
  LaunchValidator,
  MarketValidationValidator,
  ProductPortfolioValidator,
  StoreValidator,
  validateDomainPlanner,
  validateFirstRevenue,
  validateGrowth,
  validateLaunchReadiness,
  validateMonitoring,
  validatePricing,
} from "./module-validators.js";
import { EndToEndCompanyCreationTestRunner } from "./end-to-end-company-creation-test-runner.js";
import { CertificationReportGenerator } from "./certification-report-generator.js";
import { CertificationMetadataGenerator } from "./certification-metadata-generator.js";
import { CertificationValidator } from "./certification-validator.js";
import type { CompanyFactoryCertifiedConfiguration } from "./configuration.js";
import type {
  CertificationActionInput,
  CertificationEngineRecord,
  CertificationRunReport,
  CertifiedModuleId,
  CertifyCompanyFactoryInput,
  CompanyFactoryCertificationReport,
  ConnectCompanyFactoryCertifiedInput,
  ModuleCertificationResult,
} from "./types.js";

export type { CompanyFactoryCertifiedDependencies };

export class CompanyFactoryCertificationManager {
  private engineRecord: CertificationEngineRecord | null = null;
  private readonly store = new CertificationRecordStore();
  private readonly frameworkValidator = new CompanyFrameworkValidator();
  private readonly opportunityValidator = new BusinessOpportunityValidator();
  private readonly marketValidator = new MarketValidationValidator();
  private readonly modelValidator = new BusinessModelValidator();
  private readonly brandValidator = new BrandValidator();
  private readonly storeValidator = new StoreValidator();
  private readonly portfolioValidator = new ProductPortfolioValidator();
  private readonly launchValidator = new LaunchValidator();
  private readonly e2eRunner = new EndToEndCompanyCreationTestRunner();
  private readonly reportGenerator = new CertificationReportGenerator();
  private readonly metadataGenerator = new CertificationMetadataGenerator();
  private readonly validator = new CertificationValidator();

  constructor(private readonly deps: CompanyFactoryCertifiedDependencies) {}

  getEngineRecord(): CertificationEngineRecord | null {
    return this.engineRecord;
  }

  getCertificationReports(): CompanyFactoryCertificationReport[] {
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
    presence["company-factory-framework"] = this.deps.companyFactoryFramework
      ? this.probe(() => this.deps.companyFactoryFramework!.getState())
      : false;
    presence["business-opportunity-discovery"] = this.deps.businessOpportunityDiscovery
      ? this.probe(() => this.deps.businessOpportunityDiscovery!.getState())
      : false;
    presence["market-validation-engine"] = this.deps.marketValidationEngine
      ? this.probe(() => this.deps.marketValidationEngine!.getState())
      : false;
    presence["business-model-generator"] = this.deps.businessModelGenerator
      ? this.probe(() => this.deps.businessModelGenerator!.getState())
      : false;
    presence["brand-creation-engine"] = this.deps.brandCreationEngine
      ? this.probe(() => this.deps.brandCreationEngine!.getState())
      : false;
    presence["domain-digital-asset-planner"] = this.deps.domainDigitalAssetPlanner
      ? this.probe(() => this.deps.domainDigitalAssetPlanner!.getState())
      : false;
    presence["store-generation-engine"] = this.deps.storeGenerationEngine
      ? this.probe(() => this.deps.storeGenerationEngine!.getState())
      : false;
    presence["product-portfolio-builder"] = this.deps.productPortfolioBuilder
      ? this.probe(() => this.deps.productPortfolioBuilder!.getState())
      : false;
    presence["pricing-strategy-engine"] = this.deps.pricingStrategyEngine
      ? this.probe(() => this.deps.pricingStrategyEngine!.getState())
      : false;
    presence["launch-readiness-validator"] = this.deps.launchReadinessValidator
      ? this.probe(() => this.deps.launchReadinessValidator!.getState())
      : false;
    presence["business-launch-orchestrator"] = this.deps.businessLaunchOrchestrator
      ? this.probe(() => this.deps.businessLaunchOrchestrator!.getState())
      : false;
    presence["growth-initialization-engine"] = this.deps.growthInitializationEngine
      ? this.probe(() => this.deps.growthInitializationEngine!.getState())
      : false;
    presence["launch-monitoring-engine"] = this.deps.launchMonitoringEngine
      ? this.probe(() => this.deps.launchMonitoringEngine!.getState())
      : false;
    presence["first-revenue-optimizer"] = this.deps.firstRevenueOptimizer
      ? this.probe(() => this.deps.firstRevenueOptimizer!.getState())
      : false;
    return presence;
  }

  private requireConnected(): CertificationEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Company Factory Certified not connected — call connectCompanyFactoryCertified first",
      );
    }
    return this.engineRecord;
  }

  private resolveScope(
    input: CertifyCompanyFactoryInput | CertificationActionInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertifiedModuleId[] {
    const requested = input.scope?.length ? input.scope : (config.certificationScope as CertifiedModuleId[]);
    return CERTIFIED_MODULE_IDS.filter((id) => requested.includes(id));
  }

  private runAllModuleValidations(scope: CertifiedModuleId[]): ModuleCertificationResult[] {
    const all: ModuleCertificationResult[] = [
      this.frameworkValidator.validate(this.deps),
      this.opportunityValidator.validate(this.deps),
      this.marketValidator.validate(this.deps),
      this.modelValidator.validate(this.deps),
      this.brandValidator.validate(this.deps),
      validateDomainPlanner(this.deps),
      this.storeValidator.validate(this.deps),
      this.portfolioValidator.validate(this.deps),
      validatePricing(this.deps),
      validateLaunchReadiness(this.deps),
      this.launchValidator.validate(this.deps),
      validateGrowth(this.deps),
      validateMonitoring(this.deps),
      validateFirstRevenue(this.deps),
    ];
    return all.map((r) =>
      scope.includes(r.moduleId) ? r : { ...r, status: "skip", notes: "Out of certification scope" },
    );
  }

  registerWithFramework(
    config: CompanyFactoryCertifiedConfiguration,
  ): { frameworkModuleId: string | null; validation: CertificationRunReport["validation"] } {
    if (!this.deps.companyFactoryFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.companyFactoryFramework.registerCompanyModule({
      definition: {
        companyModuleIdentifier: COMPANY_FACTORY_CERTIFIED_ID,
        moduleVersion: CFC_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X1-15",
        authenticationMethod: "none",
        credentialRef: "vault://company-factory-certified",
        apiEndpointConfig: {
          baseUrl: "internal://company-factory-certified",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["company-factory.certified", "company-factory.partial", "company-factory.failed"],
          maxEventsPerMinute: 30,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: true,
          requestsPerMinute: 30,
          burstLimit: 5,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "company_module_registration",
          "company_module_activation",
          "company_event_routing",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.companyFactoryFramework.activateCompanyModule(COMPANY_FACTORY_CERTIFIED_ID);
    }

    appendCfcLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Company Factory Certified with Company Factory Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `cfc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: CFC_METADATA_VERSION,
      },
    };
  }

  connectCompanyFactoryCertified(
    _input: ConnectCompanyFactoryCertifiedInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: frameworkReg.validation.decision === "fail" ? "failed" : "active",
      validationStatus:
        frameworkReg.validation.decision === "fail"
          ? "failed"
          : frameworkReg.validation.decision === "partial"
            ? "partial"
            : "passed",
      dependencyPresence: deps,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (frameworkReg.validation.warnings.length > 0) {
      validation.warnings.push(...frameworkReg.validation.warnings);
      if (validation.decision === "pass") validation.decision = "partial";
    }

    appendCfcLog({
      event: "engine_connect",
      level: "info",
      details: `Company Factory Certified connected · deps=${Object.values(deps).filter(Boolean).length}/14`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      certificationReports: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  certifyCompanyFactory(
    input: CertifyCompanyFactoryInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateCertifyInput(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "certify_company_factory",
        engineRecord: engine,
        certificationReports: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.store.list().length >= config.maxCertificationsPerCycle) {
      return this.metadataGenerator.buildRunReport({
        action: "certify_company_factory",
        engineRecord: engine,
        certificationReports: [],
        validation: {
          validationReportId: `cfc-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [`Max certifications per cycle reached (${config.maxCertificationsPerCycle})`],
          warnings: [],
          durationMs: 0,
          metadataVersion: CFC_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    appendCfcLog({
      event: "certification_start",
      level: "info",
      details: "Company Factory certification started",
    });

    const scope = this.resolveScope(input, config);
    const moduleResults = this.runAllModuleValidations(scope);

    appendCfcLog({
      event: "module_validation",
      level: "info",
      details: `Validated ${moduleResults.filter((m) => m.status !== "skip").length} modules`,
    });

    const e2e =
      config.endToEndValidationEnabled && input.runEndToEnd !== false
        ? this.e2eRunner.run(this.deps)
        : {
            status: "skip" as const,
            evidenceReference: "structural://e2e/skipped",
            notes: "End-to-end validation disabled",
          };

    appendCfcLog({
      event: "end_to_end_workflow_validation",
      level: e2e.status === "pass" ? "info" : "warn",
      details: e2e.notes,
    });

    const overall = this.reportGenerator.deriveOverall(
      moduleResults,
      e2e.status,
      config.passThresholdPercent,
    );
    const warnings = [
      ...this.reportGenerator.collectWarnings(moduleResults),
      ...(e2e.status === "skip" ? [e2e.notes] : []),
    ];
    const errors = [
      ...this.reportGenerator.collectErrors(moduleResults),
      ...(e2e.status === "fail" ? [e2e.notes] : []),
    ];

    const fingerprint = createHash("sha256")
      .update(
        `${this.reportGenerator.summarizeModules(moduleResults)}|${overall}|${e2e.status}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);
    if (this.store.hasFingerprint(fingerprint)) {
      return this.metadataGenerator.buildRunReport({
        action: "certify_company_factory",
        engineRecord: engine,
        certificationReports: [],
        validation: {
          validationReportId: `cfc-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Duplicate certification run detected — blocked"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CFC_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const record = this.store.create({
      certifiedCompanyFactoryModules: this.reportGenerator.summarizeModules(moduleResults),
      opportunityDiscoveryStatus: this.reportGenerator.statusOf(
        moduleResults,
        "business-opportunity-discovery",
      ),
      marketValidationStatus: this.reportGenerator.statusOf(
        moduleResults,
        "market-validation-engine",
      ),
      businessModelStatus: this.reportGenerator.statusOf(
        moduleResults,
        "business-model-generator",
      ),
      brandCreationStatus: this.reportGenerator.statusOf(moduleResults, "brand-creation-engine"),
      storeGenerationStatus: this.reportGenerator.statusOf(
        moduleResults,
        "store-generation-engine",
      ),
      productPortfolioStatus: this.reportGenerator.statusOf(
        moduleResults,
        "product-portfolio-builder",
      ),
      launchStatus: this.reportGenerator.statusOf(
        moduleResults,
        "business-launch-orchestrator",
      ),
      perModulePassFailStatus: moduleResults,
      warnings,
      errors,
      endToEndValidationResult: e2e.status,
      overallCertificationStatus: overall,
      evidenceReferences: this.reportGenerator.evidenceBundle(
        moduleResults,
        e2e.evidenceReference,
      ),
      validationStatus: "pending",
    });

    const recordValidation = this.validator.validateCertificationReport(record);
    record.validationStatus =
      recordValidation.decision === "fail"
        ? "failed"
        : recordValidation.decision === "partial"
          ? "partial"
          : "passed";
    this.store.persist(record);

    appendCfcLog({
      event: "certification_completion",
      level: overall === "certified" ? "info" : "warn",
      details: `Certification ${overall} · id=${record.certificationId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "certify_company_factory",
      engineRecord: engine,
      certificationReports: [record],
      validation: recordValidation,
      durationMs: Date.now() - started,
    });
  }

  private requireReport(certificationId?: string): CompanyFactoryCertificationReport {
    if (certificationId) {
      const found = this.store.get(certificationId);
      if (!found) throw new Error(`Certification report not found: ${certificationId}`);
      return found;
    }
    const all = this.store.list();
    if (all.length === 0) throw new Error("No certification reports available");
    return all[all.length - 1]!;
  }

  private ensureReport(
    input: CertificationActionInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CompanyFactoryCertificationReport {
    try {
      return this.requireReport(input.certificationId);
    } catch {
      const created = this.certifyCompanyFactory(
        {
          scope: input.scope,
          industry: input.industry,
          validated: true,
          runEndToEnd: true,
        },
        config,
      );
      return created.certificationReports[0]!;
    }
  }

  private singleModuleAction(
    action: CertificationRunReport["action"],
    pick: (results: ModuleCertificationResult[]) => ModuleCertificationResult,
    input: CertificationActionInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const scope = this.resolveScope(input, config);
    const results = this.runAllModuleValidations(scope);
    const selected = pick(results);

    appendCfcLog({
      event: "module_validation",
      level: selected.status === "pass" ? "info" : "warn",
      details: `${action} · ${selected.moduleId}=${selected.status}`,
    });

    let report = this.ensureReport(input, config);
    report = {
      ...report,
      perModulePassFailStatus: results,
      opportunityDiscoveryStatus: this.reportGenerator.statusOf(
        results,
        "business-opportunity-discovery",
      ),
      marketValidationStatus: this.reportGenerator.statusOf(results, "market-validation-engine"),
      businessModelStatus: this.reportGenerator.statusOf(results, "business-model-generator"),
      brandCreationStatus: this.reportGenerator.statusOf(results, "brand-creation-engine"),
      storeGenerationStatus: this.reportGenerator.statusOf(results, "store-generation-engine"),
      productPortfolioStatus: this.reportGenerator.statusOf(results, "product-portfolio-builder"),
      launchStatus: this.reportGenerator.statusOf(results, "business-launch-orchestrator"),
      certifiedCompanyFactoryModules: this.reportGenerator.summarizeModules(results),
      evidenceReferences: this.reportGenerator.evidenceBundle(
        results,
        `structural://action/${action}`,
      ),
      modifiedProductionSystemsWithoutSafeTestMode: false,
      structuralSignalOnly: true,
      fabricatedCertificationFacts: false,
    };
    this.store.persist(report);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      certificationReports: [report],
      validation: this.validator.validateCertificationReport(report),
      durationMs: Date.now() - started,
    });
  }

  validateCompanyFramework(
    input: CertificationActionInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationRunReport {
    return this.singleModuleAction(
      "validate_company_framework",
      () => this.frameworkValidator.validate(this.deps),
      input,
      config,
    );
  }

  validateOpportunityDiscovery(
    input: CertificationActionInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationRunReport {
    return this.singleModuleAction(
      "validate_opportunity_discovery",
      () => this.opportunityValidator.validate(this.deps),
      input,
      config,
    );
  }

  validateMarketValidation(
    input: CertificationActionInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationRunReport {
    return this.singleModuleAction(
      "validate_market_validation",
      () => this.marketValidator.validate(this.deps),
      input,
      config,
    );
  }

  validateBusinessModel(
    input: CertificationActionInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationRunReport {
    return this.singleModuleAction(
      "validate_business_model",
      () => this.modelValidator.validate(this.deps),
      input,
      config,
    );
  }

  validateBrand(
    input: CertificationActionInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationRunReport {
    return this.singleModuleAction(
      "validate_brand",
      () => this.brandValidator.validate(this.deps),
      input,
      config,
    );
  }

  validateStore(
    input: CertificationActionInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationRunReport {
    return this.singleModuleAction(
      "validate_store",
      () => this.storeValidator.validate(this.deps),
      input,
      config,
    );
  }

  validateProductPortfolio(
    input: CertificationActionInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationRunReport {
    return this.singleModuleAction(
      "validate_product_portfolio",
      () => this.portfolioValidator.validate(this.deps),
      input,
      config,
    );
  }

  validateLaunch(
    input: CertificationActionInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationRunReport {
    return this.singleModuleAction(
      "validate_launch",
      () => this.launchValidator.validate(this.deps),
      input,
      config,
    );
  }

  runEndToEndCompanyCreation(
    input: CertificationActionInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.endToEndValidationEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "run_end_to_end_company_creation",
        engineRecord: engine,
        certificationReports: [],
        validation: {
          validationReportId: `cfc-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["End-to-end validation disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: CFC_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }

    const e2e = this.e2eRunner.run(this.deps);
    let report = this.ensureReport(input, config);
    report = {
      ...report,
      endToEndValidationResult: e2e.status,
      evidenceReferences: `${report.evidenceReferences} | ${e2e.evidenceReference}`,
      overallCertificationStatus: this.reportGenerator.deriveOverall(
        report.perModulePassFailStatus,
        e2e.status,
        config.passThresholdPercent,
      ),
      modifiedProductionSystemsWithoutSafeTestMode: false,
      structuralSignalOnly: true,
      fabricatedCertificationFacts: false,
    };
    this.store.persist(report);

    appendCfcLog({
      event: "end_to_end_workflow_validation",
      level: e2e.status === "pass" ? "info" : "warn",
      details: e2e.notes,
    });

    return this.metadataGenerator.buildRunReport({
      action: "run_end_to_end_company_creation",
      engineRecord: engine,
      certificationReports: [report],
      validation: this.validator.validateCertificationReport(report),
      durationMs: Date.now() - started,
    });
  }

  generateCertificationReport(
    input: CertificationActionInput,
    config: CompanyFactoryCertifiedConfiguration,
  ): CertificationRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const report = this.ensureReport(input, config);
    this.store.persist(report);

    appendCfcLog({
      event: "certification_completion",
      level: "info",
      details: `Report generated · id=${report.certificationId} · status=${report.overallCertificationStatus}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "generate_certification_report",
      engineRecord: engine,
      certificationReports: [report],
      validation: this.validator.validateCertificationReport(report),
      durationMs: Date.now() - started,
    });
  }
}
