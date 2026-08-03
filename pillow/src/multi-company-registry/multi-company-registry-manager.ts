/** X2-02 — Multi-Company Registry manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import {
  MCR_CAPABILITIES,
  MCR_METADATA_VERSION,
  MULTI_COMPANY_REGISTRY_ID,
} from "./paths.js";
import { appendMcrLog } from "./mcr-logging.js";
import { CompanyRegistrationEngine } from "./company-registration-engine.js";
import { CompanyProfileManager } from "./company-profile-manager.js";
import { CompanyClassificationEngine } from "./company-classification-engine.js";
import { CompanyLifecycleTracker } from "./company-lifecycle-tracker.js";
import { RegistryRecommendationEngine } from "./registry-recommendation-engine.js";
import { RegistryValidator } from "./registry-validator.js";
import { RegistryMetadataGenerator } from "./registry-metadata-generator.js";
import type { MultiCompanyRegistryConfiguration } from "./configuration.js";
import type {
  AdvanceLifecycleInput,
  ClassifyCompanyInput,
  ConnectMultiCompanyRegistryInput,
  DetectDuplicatesInput,
  RecommendRegistryInput,
  RegisterCompanyInput,
  RegistryEngineRecord,
  RegistryRunReport,
  RunRegistryDiagnosticsInput,
  UpdateCompanyProfileInput,
  UpdateOwnershipInput,
} from "./types.js";

export type MultiCompanyRegistryDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class MultiCompanyRegistryManager {
  private engineRecord: RegistryEngineRecord | null = null;
  private readonly registration = new CompanyRegistrationEngine();
  private readonly profiles: CompanyProfileManager;
  private readonly classification: CompanyClassificationEngine;
  private readonly lifecycle: CompanyLifecycleTracker;
  private readonly recommendations: RegistryRecommendationEngine;
  private readonly validator = new RegistryValidator();
  private readonly metadataGenerator = new RegistryMetadataGenerator();

  constructor(private readonly deps: MultiCompanyRegistryDependencies) {
    this.profiles = new CompanyProfileManager(this.registration);
    this.classification = new CompanyClassificationEngine(this.registration);
    this.lifecycle = new CompanyLifecycleTracker(this.registration);
    this.recommendations = new RegistryRecommendationEngine(this.registration);
  }

  getEngineRecord(): RegistryEngineRecord | null {
    return this.engineRecord;
  }

  getCompanyRecords() {
    return this.registration.list();
  }

  activeCompanyCount(): number {
    return this.registration.list().filter((c) => c.operationalStatus === "active").length;
  }

  duplicateSignalCount(): number {
    return this.registration.findDuplicates().length;
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): RegistryEngineRecord["dependencyPresence"] {
    return {
      enterprisePortfolioFramework: this.deps.enterprisePortfolioFramework
        ? this.probe(() => this.deps.enterprisePortfolioFramework!.getState())
        : false,
    };
  }

  private requireConnected(): RegistryEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Multi-Company Registry not connected — call connectMultiCompanyRegistry first",
      );
    }
    return this.engineRecord;
  }

  private failReport(
    action: RegistryRunReport["action"],
    errors: string[],
    durationMs: number,
  ): RegistryRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `mcr-eng-pending`,
        timestamp: new Date().toISOString(),
        engineId: MULTI_COMPANY_REGISTRY_ID,
        engineVersion: "PILLOW-MCR-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...MCR_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: MCR_METADATA_VERSION,
      } satisfies RegistryEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      companyRecords: [],
      validation: {
        validationReportId: `mcr-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: MCR_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(
    config: MultiCompanyRegistryConfiguration,
  ): { frameworkModuleId: string | null; validation: RegistryRunReport["validation"] } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: MULTI_COMPANY_REGISTRY_ID,
        moduleVersion: MCR_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-02",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "registry.company.registered",
            "registry.company.updated",
            "registry.lifecycle",
            "registry.duplicate",
          ],
          maxEventsPerMinute: 60,
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
          "company_registration",
          "portfolio_lifecycle_management",
          "portfolio_event_routing",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.enterprisePortfolioFramework.activatePortfolioModule(MULTI_COMPANY_REGISTRY_ID);
    }

    appendMcrLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Multi-Company Registry with Enterprise Portfolio Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `mcr-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: MCR_METADATA_VERSION,
      },
    };
  }

  connectMultiCompanyRegistry(
    _input: ConnectMultiCompanyRegistryInput,
    config: MultiCompanyRegistryConfiguration,
  ): RegistryRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();

    this.engineRecord = {
      engineRecordId: `mcr-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: MULTI_COMPANY_REGISTRY_ID,
      engineVersion: "PILLOW-MCR-001",
      currentOperationalState: "connected",
      healthStatus: presence.enterprisePortfolioFramework ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...MCR_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: MCR_METADATA_VERSION,
    };

    appendMcrLog({
      event: "engine_connected",
      level: "info",
      details: "Multi-Company Registry connected",
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: this.engineRecord,
      companyRecords: this.registration.list(),
      validation: {
        ...framework.validation,
        warnings: [
          ...framework.validation.warnings,
          ...configValidation.warnings,
          ...(presence.enterprisePortfolioFramework
            ? []
            : ["Enterprise Portfolio Framework dependency unavailable"]),
        ],
        decision:
          framework.validation.decision === "fail"
            ? "fail"
            : !presence.enterprisePortfolioFramework
              ? "partial"
              : framework.validation.decision,
      },
      durationMs: Date.now() - started,
    });
  }

  registerCompany(
    input: RegisterCompanyInput,
    config: MultiCompanyRegistryConfiguration,
  ): RegistryRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateRegistration(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "register_company",
          engineRecord,
          companyRecords: [],
          validation,
          durationMs: Date.now() - started,
        });
      }

      if (this.registration.list().length >= config.maxRegisteredCompanies) {
        validation.decision = "fail";
        validation.errors.push("Maximum registered companies reached");
        return this.metadataGenerator.buildRunReport({
          action: "register_company",
          engineRecord,
          companyRecords: [],
          validation,
          durationMs: Date.now() - started,
        });
      }

      const ownershipReference =
        input.ownershipReference?.trim() ||
        `structural://ownership/${input.companyName.trim().toLowerCase().replace(/\s+/g, "-")}`;
      const existing = this.registration.findByIdentity(input.companyName, ownershipReference);
      if (existing && !input.allowDuplicate) {
        validation.decision = "fail";
        validation.errors.push(
          "Duplicate company registration detected — set allowDuplicate=true with validation to proceed",
        );
        return this.metadataGenerator.buildRunReport({
          action: "register_company",
          engineRecord,
          companyRecords: [existing],
          validation,
          durationMs: Date.now() - started,
        });
      }

      if (existing && input.allowDuplicate) {
        validation.warnings.push("Duplicate registration accepted under validated allowDuplicate");
      }

      const record = this.registration.register({
        ...input,
        ownershipReference,
      });

      if (this.deps.enterprisePortfolioFramework) {
        safe(() => {
          this.deps.enterprisePortfolioFramework!.registerCompany({
            companyReference: record.companyId,
            portfolioModuleIdentifier: MULTI_COMPANY_REGISTRY_ID,
            validated: true,
          });
        }, null);
      }

      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();
      const recordValidation = this.validator.validateRecord(record);
      if (recordValidation.decision === "fail") {
        validation.decision = "fail";
        validation.errors.push(...recordValidation.errors);
      }

      return this.metadataGenerator.buildRunReport({
        action: "register_company",
        engineRecord,
        companyRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "register_company",
        [error instanceof Error ? error.message : "Registration failed"],
        Date.now() - started,
      );
    }
  }

  updateProfile(
    input: UpdateCompanyProfileInput,
    config: MultiCompanyRegistryConfiguration,
  ): RegistryRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateProfileUpdate(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "update_profile",
          engineRecord,
          companyRecords: [],
          validation,
          durationMs: Date.now() - started,
        });
      }
      const record = this.profiles.updateProfile(input);
      return this.metadataGenerator.buildRunReport({
        action: "update_profile",
        engineRecord,
        companyRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "update_profile",
        [error instanceof Error ? error.message : "Profile update failed"],
        Date.now() - started,
      );
    }
  }

  updateOwnership(
    input: UpdateOwnershipInput,
    config: MultiCompanyRegistryConfiguration,
  ): RegistryRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateOwnership(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "update_ownership",
          engineRecord,
          companyRecords: [],
          validation,
          durationMs: Date.now() - started,
        });
      }
      const record = this.profiles.updateProfile({
        companyId: input.companyId,
        ownershipReference: input.ownershipReference,
        validated: true,
      });
      return this.metadataGenerator.buildRunReport({
        action: "update_ownership",
        engineRecord,
        companyRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "update_ownership",
        [error instanceof Error ? error.message : "Ownership update failed"],
        Date.now() - started,
      );
    }
  }

  classifyCompany(
    input: ClassifyCompanyInput,
    config: MultiCompanyRegistryConfiguration,
  ): RegistryRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateClassification(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "classify",
          engineRecord,
          companyRecords: [],
          validation,
          durationMs: Date.now() - started,
        });
      }
      const record = this.classification.classify(input);
      return this.metadataGenerator.buildRunReport({
        action: "classify",
        engineRecord,
        companyRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "classify",
        [error instanceof Error ? error.message : "Classification failed"],
        Date.now() - started,
      );
    }
  }

  advanceLifecycle(
    input: AdvanceLifecycleInput,
    config: MultiCompanyRegistryConfiguration,
  ): RegistryRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateLifecycle(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "advance_lifecycle",
          engineRecord,
          companyRecords: [],
          validation,
          durationMs: Date.now() - started,
        });
      }
      const record = this.lifecycle.advance(input);
      return this.metadataGenerator.buildRunReport({
        action: "advance_lifecycle",
        engineRecord,
        companyRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "advance_lifecycle",
        [error instanceof Error ? error.message : "Lifecycle advance failed"],
        Date.now() - started,
      );
    }
  }

  detectDuplicates(
    input: DetectDuplicatesInput,
    _config: MultiCompanyRegistryConfiguration,
  ): RegistryRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const duplicates = this.registration.findDuplicates(input.companyId);
      const warnings =
        duplicates.length > 0
          ? [`Detected ${duplicates.length} duplicate registration signal(s)`]
          : [];
      appendMcrLog({
        event: "duplicate_detection",
        level: duplicates.length > 0 ? "warn" : "info",
        details:
          duplicates.length > 0
            ? `Duplicates found: ${duplicates.map((d) => d.companyId).join(", ")}`
            : "No duplicates detected",
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_duplicates",
        engineRecord,
        companyRecords: duplicates,
        validation: {
          validationReportId: `mcr-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: duplicates.length > 0 ? "partial" : "pass",
          errors: [],
          warnings,
          durationMs: Date.now() - started,
          metadataVersion: MCR_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "detect_duplicates",
        [error instanceof Error ? error.message : "Duplicate detection failed"],
        Date.now() - started,
      );
    }
  }

  generateRecommendations(
    input: RecommendRegistryInput,
    _config: MultiCompanyRegistryConfiguration,
  ): RegistryRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const recommendations = this.recommendations.recommend(input.companyId);
      const companies = input.companyId
        ? [this.registration.get(input.companyId)].filter(Boolean)
        : this.registration.list();
      return this.metadataGenerator.buildRunReport({
        action: "recommend",
        engineRecord,
        companyRecords: companies as ReturnType<CompanyRegistrationEngine["list"]>,
        recommendations,
        validation: {
          validationReportId: `mcr-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: MCR_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "recommend",
        [error instanceof Error ? error.message : "Recommendation generation failed"],
        Date.now() - started,
      );
    }
  }

  runDiagnostics(
    input: RunRegistryDiagnosticsInput,
    _config: MultiCompanyRegistryConfiguration,
  ): RegistryRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const companies = input.companyId
        ? [this.registration.get(input.companyId)].filter(Boolean)
        : this.registration.list();
      const errors: string[] = [];
      const warnings: string[] = [];

      if (companies.length === 0) {
        errors.push(input.companyId ? "Company not found" : "No companies registered");
      }
      for (const company of companies) {
        if (!company) continue;
        if (company.validationStatus === "failed") {
          warnings.push(`${company.companyId}: validation failed`);
        }
        if (company.operationalStatus === "pending") {
          warnings.push(`${company.companyId}: operational status pending`);
        }
      }

      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        companyRecords: companies as ReturnType<CompanyRegistrationEngine["list"]>,
        validation: {
          validationReportId: `mcr-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
          errors,
          warnings,
          durationMs: Date.now() - started,
          metadataVersion: MCR_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "diagnostics",
        [error instanceof Error ? error.message : "Diagnostics failed"],
        Date.now() - started,
      );
    }
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registration.resetForTesting();
  }
}
