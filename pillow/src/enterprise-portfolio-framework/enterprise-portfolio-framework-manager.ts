/** X2-01 — Enterprise Portfolio Framework manager. */

import { PortfolioModuleRegistry } from "./portfolio-module-registry.js";
import { PortfolioLifecycleManager } from "./portfolio-lifecycle-manager.js";
import { PortfolioConfigurationManager } from "./portfolio-configuration-manager.js";
import { PortfolioValidationEngine } from "./portfolio-validation-engine.js";
import { PortfolioMetadataGenerator } from "./portfolio-metadata-generator.js";
import { PortfolioEventRateLimitManager } from "./portfolio-event-rate-limit-manager.js";
import { EnterpriseEventRouter } from "./enterprise-event-router.js";
import { PortfolioDataAbstractionLayer } from "./portfolio-data-abstraction.js";
import { EPF_METADATA_VERSION } from "./paths.js";
import type { EnterprisePortfolioFrameworkConfiguration } from "./configuration.js";
import type {
  AbstractPortfolioDataInput,
  EnterprisePortfolioFrameworkRecord,
  PortfolioFrameworkRunReport,
  RegisterPortfolioCompanyInput,
  RegisterPortfolioModuleInput,
  RegisteredCompanyRef,
  RoutePortfolioEventInput,
  RunPortfolioDiagnosticsInput,
} from "./types.js";

export class EnterprisePortfolioFrameworkManager {
  private readonly registry = new PortfolioModuleRegistry();
  private readonly lifecycle = new PortfolioLifecycleManager();
  private readonly configManager = new PortfolioConfigurationManager();
  private readonly validationEngine = new PortfolioValidationEngine();
  private readonly metadataGenerator = new PortfolioMetadataGenerator();
  private readonly rateLimitManager = new PortfolioEventRateLimitManager();
  private readonly eventRouter: EnterpriseEventRouter;
  private readonly dataAbstraction: PortfolioDataAbstractionLayer;
  private readonly companies = new Map<string, RegisteredCompanyRef>();

  constructor() {
    this.eventRouter = new EnterpriseEventRouter(
      this.registry,
      this.rateLimitManager,
      this.validationEngine,
    );
    this.dataAbstraction = new PortfolioDataAbstractionLayer(this.registry);
  }

  getRegistry() {
    return this.registry;
  }

  getModules(): EnterprisePortfolioFrameworkRecord[] {
    return this.registry.list();
  }

  getCompanies(): RegisteredCompanyRef[] {
    return [...this.companies.values()];
  }

  registerPortfolioModule(
    input: RegisterPortfolioModuleInput,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioFrameworkRunReport {
    const started = Date.now();
    const merged = this.configManager.mergeDefaults(input.definition, config);
    const validation = this.validationEngine.validateRegistration(merged, config);

    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "register_module",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.registry.get(merged.portfolioModuleIdentifier) && !input.forceRegister) {
      validation.decision = "fail";
      validation.errors.push("Module already registered — use forceRegister to replace");
      return this.metadataGenerator.buildRunReport({
        action: "register_module",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.registry.list().length >= config.maxRegisteredModules) {
      validation.decision = "fail";
      validation.errors.push("Maximum registered portfolio modules reached");
      return this.metadataGenerator.buildRunReport({
        action: "register_module",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const record = this.registry.register(merged);
    this.lifecycle.initialize(this.registry, merged.portfolioModuleIdentifier);
    const recordValidation = this.validationEngine.validateRecord(record, config);
    validation.portfolioFrameworkId = record.portfolioFrameworkId;
    if (recordValidation.decision === "fail") {
      validation.decision = "fail";
      validation.errors.push(...recordValidation.errors);
    }

    return this.metadataGenerator.buildRunReport({
      action: "register_module",
      records: [record],
      validation,
      durationMs: Date.now() - started,
    });
  }

  registerCompany(
    input: RegisterPortfolioCompanyInput,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioFrameworkRunReport {
    const started = Date.now();
    const validation = this.validationEngine.validateCompany(input.companyReference, config);

    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "register_company",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.companies.size >= config.maxRegisteredCompanies) {
      validation.decision = "fail";
      validation.errors.push("Maximum registered companies reached");
      return this.metadataGenerator.buildRunReport({
        action: "register_company",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.companies.has(input.companyReference) && !input.validated) {
      validation.warnings.push("Company already registered — structural idempotent accept");
    }

    const company: RegisteredCompanyRef = {
      companyReference: input.companyReference,
      registeredAt: new Date().toISOString(),
      isolationKey: `epf-iso-${input.companyReference}`,
      structuralSignalOnly: true,
    };
    this.companies.set(input.companyReference, company);

    let record: EnterprisePortfolioFrameworkRecord | null = null;
    if (input.portfolioModuleIdentifier) {
      record = this.registry.attachCompany(
        input.portfolioModuleIdentifier,
        input.companyReference,
      );
      if (!record) {
        validation.decision = "fail";
        validation.errors.push("Portfolio module not found for company attachment");
        return this.metadataGenerator.buildRunReport({
          action: "register_company",
          records: [],
          companies: [company],
          validation,
          durationMs: Date.now() - started,
        });
      }
      validation.portfolioFrameworkId = record.portfolioFrameworkId;
    }

    return this.metadataGenerator.buildRunReport({
      action: "register_company",
      records: record ? [record] : [],
      companies: [company],
      validation,
      durationMs: Date.now() - started,
    });
  }

  activatePortfolioModule(
    portfolioModuleIdentifier: string,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioFrameworkRunReport {
    const started = Date.now();
    const recordBefore = this.registry.get(portfolioModuleIdentifier);
    if (!recordBefore) {
      const validation = {
        validationReportId: `epf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        portfolioFrameworkId: null,
        errors: ["Portfolio module not found"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: EPF_METADATA_VERSION,
      };
      return this.metadataGenerator.buildRunReport({
        action: "activate",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    this.lifecycle.initialize(this.registry, portfolioModuleIdentifier);
    const result = this.lifecycle.activate(this.registry, portfolioModuleIdentifier);
    const record = result.record;
    const validation = this.validationEngine.validateRecord(record!, config);
    if (!result.ok) {
      validation.decision = "fail";
      validation.errors.push(result.error ?? "Activation failed");
    }

    return this.metadataGenerator.buildRunReport({
      action: "activate",
      records: record ? [record] : [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  suspendPortfolioModule(
    portfolioModuleIdentifier: string,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioFrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.suspend(this.registry, portfolioModuleIdentifier);
    const validation = this.validationEngine.validateRecord(
      result.record ?? ({ portfolioFrameworkId: "epf-missing" } as EnterprisePortfolioFrameworkRecord),
      config,
    );
    if (!result.ok) {
      validation.decision = "fail";
      validation.errors.push(result.error ?? "Suspend failed");
    }
    return this.metadataGenerator.buildRunReport({
      action: "suspend",
      records: result.record ? [result.record] : [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  shutdownPortfolioModule(
    portfolioModuleIdentifier: string,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioFrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.shutdown(this.registry, portfolioModuleIdentifier);
    const validation = this.validationEngine.validateRecord(
      result.record ?? ({ portfolioFrameworkId: "epf-missing" } as EnterprisePortfolioFrameworkRecord),
      config,
    );
    if (!result.ok) {
      validation.decision = "fail";
      validation.errors.push(result.error ?? "Shutdown failed");
    }
    return this.metadataGenerator.buildRunReport({
      action: "shutdown",
      records: result.record ? [result.record] : [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  routePortfolioEvent(
    input: RoutePortfolioEventInput,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioFrameworkRunReport {
    const started = Date.now();
    try {
      const routed = this.eventRouter.routeEvent(input, config);
      const record = this.registry.get(input.portfolioModuleIdentifier);
      const validation = this.validationEngine.validateRecord(record!, config);
      if (routed.rateLimited) validation.warnings.push("Event was rate limited");
      return this.metadataGenerator.buildRunReport({
        action: "route_event",
        records: record ? [record] : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = {
        validationReportId: `epf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        portfolioFrameworkId: null,
        errors: [error instanceof Error ? error.message : "Event routing failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: EPF_METADATA_VERSION,
      };
      return this.metadataGenerator.buildRunReport({
        action: "route_event",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  abstractPortfolioData(
    input: AbstractPortfolioDataInput,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioFrameworkRunReport {
    const started = Date.now();
    try {
      this.dataAbstraction.abstractData(input, config);
      const record = this.registry.get(input.portfolioModuleIdentifier);
      const validation = this.validationEngine.validateRecord(record!, config);
      return this.metadataGenerator.buildRunReport({
        action: "abstract_data",
        records: record ? [record] : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = {
        validationReportId: `epf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        portfolioFrameworkId: null,
        errors: [error instanceof Error ? error.message : "Data abstraction failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: EPF_METADATA_VERSION,
      };
      return this.metadataGenerator.buildRunReport({
        action: "abstract_data",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  runDiagnostics(
    input: RunPortfolioDiagnosticsInput,
    config: EnterprisePortfolioFrameworkConfiguration,
  ): PortfolioFrameworkRunReport {
    const started = Date.now();
    const modules = input.portfolioModuleIdentifier
      ? [this.registry.get(input.portfolioModuleIdentifier)].filter(Boolean)
      : this.registry.list();

    const records = modules as EnterprisePortfolioFrameworkRecord[];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const record of records) {
      if (record.healthStatus === "failed") {
        warnings.push(`${record.portfolioModuleIdentifier}: health failed`);
      }
      if (record.operationalState === "registered") {
        warnings.push(`${record.portfolioModuleIdentifier}: not initialized`);
      }
    }

    if (records.length === 0) {
      errors.push(
        input.portfolioModuleIdentifier ? "Module not found" : "No portfolio modules registered",
      );
    }

    const validation = {
      validationReportId: `epf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: (errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass") as
        | "pass"
        | "partial"
        | "fail",
      portfolioFrameworkId: records[0]?.portfolioFrameworkId ?? null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: EPF_METADATA_VERSION,
    };

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      records,
      companies: this.getCompanies(),
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.registry.resetForTesting();
    this.rateLimitManager.resetForTesting();
    this.companies.clear();
  }
}
