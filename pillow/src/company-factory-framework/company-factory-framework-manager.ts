/** X1-01 — Company Factory Framework manager. */

import { CompanyModuleRegistry } from "./company-module-registry.js";
import { CompanyLifecycleManager } from "./company-lifecycle-manager.js";
import { CompanyConfigurationManager } from "./company-configuration-manager.js";
import { CompanyCredentialAdapter } from "./company-credential-adapter.js";
import { CompanyValidationEngine } from "./company-validation-engine.js";
import { CompanyMetadataGenerator } from "./company-metadata-generator.js";
import { CompanyRateLimitManager } from "./company-rate-limit-manager.js";
import { CompanyEventRouter } from "./company-event-router.js";
import { CompanyDataAbstractionLayer } from "./company-data-abstraction.js";
import { COMPANY_FACTORY_METADATA_VERSION } from "./paths.js";
import type { CompanyFactoryFrameworkConfiguration } from "./configuration.js";
import type {
  AbstractCompanyDataInput,
  FrameworkRunReport,
  RegisterCompanyModuleInput,
  RouteCompanyEventInput,
  RunDiagnosticsInput,
  CompanyFactoryFrameworkRecord,
} from "./types.js";

export class CompanyFactoryFrameworkManager {
  private readonly registry = new CompanyModuleRegistry();
  private readonly lifecycle = new CompanyLifecycleManager();
  private readonly configManager = new CompanyConfigurationManager();
  private readonly credentialAdapter = new CompanyCredentialAdapter();
  private readonly validationEngine = new CompanyValidationEngine();
  private readonly metadataGenerator = new CompanyMetadataGenerator();
  private readonly rateLimitManager = new CompanyRateLimitManager();
  private readonly eventRouter: CompanyEventRouter;
  private readonly dataAbstraction: CompanyDataAbstractionLayer;

  constructor() {
    this.eventRouter = new CompanyEventRouter(
      this.registry,
      this.rateLimitManager,
      this.validationEngine,
    );
    this.dataAbstraction = new CompanyDataAbstractionLayer(this.registry);
  }

  getRegistry() {
    return this.registry;
  }

  getModules(): CompanyFactoryFrameworkRecord[] {
    return this.registry.list();
  }

  registerCompanyModule(
    input: RegisterCompanyModuleInput,
    config: CompanyFactoryFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const merged = this.configManager.mergeDefaults(input.definition, config);
    const validation = this.validationEngine.validateRegistration(merged, config);

    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "register",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.registry.get(merged.companyModuleIdentifier) && !input.forceRegister) {
      validation.decision = "fail";
      validation.errors.push("Module already registered — use forceRegister to replace");
      return this.metadataGenerator.buildRunReport({
        action: "register",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.registry.list().length >= config.maxRegisteredModules) {
      validation.decision = "fail";
      validation.errors.push("Maximum registered Company modules reached");
      return this.metadataGenerator.buildRunReport({
        action: "register",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const record = this.registry.register(merged);
    this.lifecycle.initialize(this.registry, merged.companyModuleIdentifier);
    const recordValidation = this.validationEngine.validateRecord(record, config);
    validation.frameworkId = record.frameworkId;
    if (recordValidation.decision === "fail") {
      validation.decision = "fail";
      validation.errors.push(...recordValidation.errors);
    }

    return this.metadataGenerator.buildRunReport({
      action: "register",
      records: [record],
      validation,
      durationMs: Date.now() - started,
    });
  }

  activateCompanyModule(
    companyModuleIdentifier: string,
    config: CompanyFactoryFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const recordBefore = this.registry.get(companyModuleIdentifier);
    if (!recordBefore) {
      const validation = {
        validationReportId: `cff-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        frameworkId: null,
        errors: ["Company module not found"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: COMPANY_FACTORY_METADATA_VERSION,
      };
      return this.metadataGenerator.buildRunReport({
        action: "activate",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    this.lifecycle.initialize(this.registry, companyModuleIdentifier);
    const result = this.lifecycle.activate(this.registry, companyModuleIdentifier);
    const record = result.record;
    const validation = this.validationEngine.validateRecord(record!, config);
    if (!result.ok) {
      validation.decision = "fail";
      validation.errors.push(result.error ?? "Activation failed");
    } else if (record) {
      const cred = this.credentialAdapter.validateCredentials(
        {
          companyModuleIdentifier,
          method: record.authenticationMethod,
          credentialRef: record.credentialRefPresent
            ? `vault://${companyModuleIdentifier}`
            : null,
        },
        config,
      );
      if (!cred.validated && record.authenticationMethod !== "none") {
        validation.decision = "fail";
        validation.errors.push("Credential validation failed during activation");
        this.lifecycle.transition(this.registry, companyModuleIdentifier, "failed");
      }
    }

    return this.metadataGenerator.buildRunReport({
      action: "activate",
      records: record ? [record] : [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  suspendCompanyModule(
    companyModuleIdentifier: string,
    config: CompanyFactoryFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.suspend(this.registry, companyModuleIdentifier);
    const validation = this.validationEngine.validateRecord(
      result.record ?? ({ frameworkId: "" } as CompanyFactoryFrameworkRecord),
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

  shutdownCompanyModule(
    companyModuleIdentifier: string,
    config: CompanyFactoryFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.shutdown(this.registry, companyModuleIdentifier);
    const validation = this.validationEngine.validateRecord(
      result.record ?? ({ frameworkId: "" } as CompanyFactoryFrameworkRecord),
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

  routeCompanyEvent(
    input: RouteCompanyEventInput,
    config: CompanyFactoryFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    try {
      const routed = this.eventRouter.routeEvent(input, config);
      const record = this.registry.get(input.companyModuleIdentifier);
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
        validationReportId: `cff-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        frameworkId: null,
        errors: [error instanceof Error ? error.message : "Event routing failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: COMPANY_FACTORY_METADATA_VERSION,
      };
      return this.metadataGenerator.buildRunReport({
        action: "route_event",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  abstractCompanyData(
    input: AbstractCompanyDataInput,
    config: CompanyFactoryFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    try {
      this.dataAbstraction.abstractData(input, config);
      const record = this.registry.get(input.companyModuleIdentifier);
      const validation = this.validationEngine.validateRecord(record!, config);
      return this.metadataGenerator.buildRunReport({
        action: "abstract_data",
        records: record ? [record] : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = {
        validationReportId: `cff-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        frameworkId: null,
        errors: [error instanceof Error ? error.message : "Data abstraction failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: COMPANY_FACTORY_METADATA_VERSION,
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
    input: RunDiagnosticsInput,
    config: CompanyFactoryFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const modules = input.companyModuleIdentifier
      ? [this.registry.get(input.companyModuleIdentifier)].filter(Boolean)
      : this.registry.list();

    const records = modules as CompanyFactoryFrameworkRecord[];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const record of records) {
      if (record.healthStatus === "failed") {
        warnings.push(`${record.companyModuleIdentifier}: health failed`);
      }
      if (record.operationalState === "registered") {
        warnings.push(`${record.companyModuleIdentifier}: not initialized`);
      }
    }

    if (records.length === 0) {
      errors.push(input.companyModuleIdentifier ? "Module not found" : "No modules registered");
    }

    const validation = {
      validationReportId: `cff-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: (errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass") as
        | "pass"
        | "partial"
        | "fail",
      frameworkId: records[0]?.frameworkId ?? null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: COMPANY_FACTORY_METADATA_VERSION,
    };

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      records,
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.registry.resetForTesting();
    this.rateLimitManager.resetForTesting();
  }
}
