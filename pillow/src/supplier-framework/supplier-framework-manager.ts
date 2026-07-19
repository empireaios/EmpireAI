/** R2-01 — Supplier Framework manager. */

import { SupplierConnectorRegistry } from "./supplier-connector-registry.js";
import { SupplierLifecycleManager } from "./supplier-lifecycle-manager.js";
import { SupplierConfigurationManager } from "./supplier-configuration-manager.js";
import { SupplierAuthenticationAdapter } from "./supplier-authentication-adapter.js";
import { SupplierValidationEngine } from "./supplier-validation-engine.js";
import { SupplierMetadataGenerator } from "./supplier-metadata-generator.js";
import { SupplierRateLimitManager } from "./supplier-rate-limit-manager.js";
import { SupplierEventRouter } from "./supplier-event-router.js";
import { SupplierDataAbstractionLayer } from "./supplier-data-abstraction.js";
import type { SupplierFrameworkConfiguration } from "./configuration.js";
import type {
  AbstractSupplierDataInput,
  FrameworkRunReport,
  RegisterSupplierInput,
  RouteSupplierEventInput,
  RunDiagnosticsInput,
  SupplierFrameworkRecord,
} from "./types.js";

export class SupplierFrameworkManager {
  private readonly registry = new SupplierConnectorRegistry();
  private readonly lifecycle = new SupplierLifecycleManager();
  private readonly configManager = new SupplierConfigurationManager();
  private readonly authAdapter = new SupplierAuthenticationAdapter();
  private readonly validationEngine = new SupplierValidationEngine();
  private readonly metadataGenerator = new SupplierMetadataGenerator();
  private readonly rateLimitManager = new SupplierRateLimitManager();
  private readonly eventRouter: SupplierEventRouter;
  private readonly dataAbstraction: SupplierDataAbstractionLayer;

  constructor() {
    this.eventRouter = new SupplierEventRouter(
      this.registry,
      this.rateLimitManager,
      this.validationEngine,
    );
    this.dataAbstraction = new SupplierDataAbstractionLayer(this.registry);
  }

  getRegistry() {
    return this.registry;
  }

  getSuppliers(): SupplierFrameworkRecord[] {
    return this.registry.list();
  }

  registerSupplier(
    input: RegisterSupplierInput,
    config: SupplierFrameworkConfiguration,
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

    if (this.registry.get(merged.supplierIdentifier) && !input.forceRegister) {
      validation.decision = "fail";
      validation.errors.push("Supplier already registered — use forceRegister to replace");
      return this.metadataGenerator.buildRunReport({
        action: "register",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.registry.list().length >= config.maxRegisteredSuppliers) {
      validation.decision = "fail";
      validation.errors.push("Maximum registered suppliers reached");
      return this.metadataGenerator.buildRunReport({
        action: "register",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const record = this.registry.register(merged);
    this.lifecycle.initialize(this.registry, merged.supplierIdentifier);
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

  activateSupplier(
    supplierIdentifier: string,
    config: SupplierFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const recordBefore = this.registry.get(supplierIdentifier);
    if (!recordBefore) {
      const validation = {
        validationReportId: `sf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        frameworkId: null,
        errors: ["Supplier connector not found"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: "SF-001-v1",
      };
      return this.metadataGenerator.buildRunReport({
        action: "activate",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    this.lifecycle.initialize(this.registry, supplierIdentifier);
    const result = this.lifecycle.activate(this.registry, supplierIdentifier);
    const record = result.record;
    const validation = this.validationEngine.validateRecord(record!, config);
    if (!result.ok) {
      validation.decision = "fail";
      validation.errors.push(result.error ?? "Activation failed");
    } else if (record) {
      const auth = this.authAdapter.authenticate(
        {
          supplierIdentifier,
          method: record.authenticationMethod,
          credentialRef: record.credentialRefPresent ? `vault://${supplierIdentifier}` : null,
        },
        config,
      );
      if (!auth.authenticated && record.authenticationMethod !== "none") {
        validation.decision = "fail";
        validation.errors.push("Authentication failed during activation");
        this.lifecycle.transition(this.registry, supplierIdentifier, "failed");
      }
    }

    return this.metadataGenerator.buildRunReport({
      action: "activate",
      records: record ? [record] : [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  suspendSupplier(supplierIdentifier: string, config: SupplierFrameworkConfiguration): FrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.suspend(this.registry, supplierIdentifier);
    const validation = this.validationEngine.validateRecord(
      result.record ?? ({ frameworkId: "" } as SupplierFrameworkRecord),
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

  shutdownSupplier(supplierIdentifier: string, config: SupplierFrameworkConfiguration): FrameworkRunReport {
    const started = Date.now();
    const result = this.lifecycle.shutdown(this.registry, supplierIdentifier);
    const validation = this.validationEngine.validateRecord(
      result.record ?? ({ frameworkId: "" } as SupplierFrameworkRecord),
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

  routeSupplierEvent(
    input: RouteSupplierEventInput,
    config: SupplierFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    try {
      const routed = this.eventRouter.routeEvent(input, config);
      const record = this.registry.get(input.supplierIdentifier);
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
        validationReportId: `sf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        frameworkId: null,
        errors: [error instanceof Error ? error.message : "Event routing failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: "SF-001-v1",
      };
      return this.metadataGenerator.buildRunReport({
        action: "route_event",
        records: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  abstractSupplierData(
    input: AbstractSupplierDataInput,
    config: SupplierFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    try {
      this.dataAbstraction.abstractData(input, config);
      const record = this.registry.get(input.supplierIdentifier);
      const validation = this.validationEngine.validateRecord(record!, config);
      return this.metadataGenerator.buildRunReport({
        action: "abstract_data",
        records: record ? [record] : [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = {
        validationReportId: `sf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail" as const,
        frameworkId: null,
        errors: [error instanceof Error ? error.message : "Data abstraction failed"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: "SF-001-v1",
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
    config: SupplierFrameworkConfiguration,
  ): FrameworkRunReport {
    const started = Date.now();
    const suppliers = input.supplierIdentifier
      ? [this.registry.get(input.supplierIdentifier)].filter(Boolean)
      : this.registry.list();

    const records = suppliers as SupplierFrameworkRecord[];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const record of records) {
      if (record.healthStatus === "failed") {
        warnings.push(`${record.supplierIdentifier}: health failed`);
      }
      if (record.operationalState === "registered") {
        warnings.push(`${record.supplierIdentifier}: not initialized`);
      }
    }

    if (records.length === 0) {
      errors.push(input.supplierIdentifier ? "Supplier not found" : "No suppliers registered");
    }

    const validation = {
      validationReportId: `sf-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: (errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass") as
        | "pass"
        | "partial"
        | "fail",
      frameworkId: records[0]?.frameworkId ?? null,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: "SF-001-v1",
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
