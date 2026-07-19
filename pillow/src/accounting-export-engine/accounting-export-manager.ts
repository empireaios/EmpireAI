/** R3-17 — Accounting Export Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { ReconciliationEngine } from "../reconciliation-engine/engine.js";
import type { InvoiceGeneratorEngine } from "../invoice-generator/engine.js";
import type { RefundEngine } from "../refund-engine/engine.js";
import type { TaxIntelligenceEngine } from "../tax-intelligence-engine/engine.js";
import { ACCOUNTING_EXPORT_ENGINE_ID, AEE_METADATA_VERSION } from "./paths.js";
import { appendAeeLog } from "./aee-logging.js";
import { ExportRegistry } from "./export-registry.js";
import { AccountingDataSource } from "./accounting-data-source.js";
import { FinancialExportEngine } from "./financial-export-engine.js";
import { ExportFormatManager } from "./export-format-manager.js";
import { ExportValidationEngine } from "./export-validation-engine.js";
import { ExportPackagingEngine } from "./export-packaging-engine.js";
import { ExportMetadataGenerator } from "./export-metadata-generator.js";
import { ExportValidator } from "./export-validator.js";
import { ExportRetryManager } from "./export-retry-manager.js";
import type { AccountingExportEngineConfiguration } from "./configuration.js";
import type {
  AccountingExportEngineRecord,
  AccountingExportRunReport,
  ConnectAccountingExportEngineInput,
  DetectExportFailuresInput,
  ExportFailure,
  ExportFinancialRecordsInput,
  ExportPackage,
  ExportRecord,
  PackageExportInput,
  ValidateExportInput,
} from "./types.js";

export class AccountingExportManager {
  private engineRecord: AccountingExportEngineRecord | null = null;
  private readonly registry = new ExportRegistry();
  private readonly validator = new ExportValidator();
  private readonly validationEngine = new ExportValidationEngine();
  private readonly metadataGenerator = new ExportMetadataGenerator();
  private readonly exportEngine = new FinancialExportEngine();
  private readonly formatManager = new ExportFormatManager();
  private readonly packagingEngine = new ExportPackagingEngine();
  private readonly retryManager = new ExportRetryManager();
  private readonly dataSource: AccountingDataSource;
  private readonly failures: ExportFailure[] = [];
  private readonly packages = new Map<string, ExportPackage>();

  constructor(
    private readonly framework: FinancialFrameworkEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly reconciliationEngine: ReconciliationEngine | null,
    private readonly invoiceGenerator: InvoiceGeneratorEngine | null,
    private readonly refundEngine: RefundEngine | null,
    private readonly taxIntelligenceEngine: TaxIntelligenceEngine | null,
  ) {
    this.dataSource = new AccountingDataSource(
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
      reconciliationEngine,
      invoiceGenerator,
      refundEngine,
      taxIntelligenceEngine,
    );
  }

  getEngineRecord(): AccountingExportEngineRecord | null {
    return this.engineRecord;
  }

  getExportRecords(): ExportRecord[] {
    return this.registry.list();
  }

  getPackages(): ExportPackage[] {
    return [...this.packages.values()];
  }

  getFailures(): ExportFailure[] {
    return [...this.failures];
  }

  private isConnected(record: { currentOperationalState?: string } | null | undefined): boolean {
    const state = record?.currentOperationalState;
    return state === "active" || state === "connected";
  }

  private probeConnections() {
    return {
      reConnected: this.isConnected(this.revenueEngine?.getEngineRecord?.()),
      exConnected: this.isConnected(this.expenseEngine?.getEngineRecord?.()),
      pcConnected: this.isConnected(this.profitCalculationEngine?.getEngineRecord?.()),
      rcConnected: this.isConnected(this.reconciliationEngine?.getEngineRecord?.()),
      igConnected: this.isConnected(this.invoiceGenerator?.getGeneratorRecord?.()),
      rfConnected: this.isConnected(this.refundEngine?.getEngineRecord?.()),
      txConnected: this.isConnected(this.taxIntelligenceEngine?.getEngineRecord?.()),
    };
  }

  registerWithFramework(
    config: AccountingExportEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: AccountingExportRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: ACCOUNTING_EXPORT_ENGINE_ID,
        moduleVersion: AEE_METADATA_VERSION,
        moduleType: "financial",
        integrationMissionId: "R3-17",
        authenticationMethod: "none",
        apiEndpointConfig: {
          baseUrl: "internal://accounting-export-engine",
          protocol: "sdk",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["export.generated", "export.validated", "export.failed"],
          maxEventsPerMinute: 120,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: false,
          requestsPerMinute: 120,
          burstLimit: 20,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "financial_module_registration",
          "financial_module_activation",
          "financial_event_routing",
        ],
      },
      forceRegister: true,
    });

    appendAeeLog({
      event: "engine_initialization",
      level: "info",
      details: `Registered accounting export engine with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `aee-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: AEE_METADATA_VERSION,
      },
    };
  }

  connectAccountingExportEngine(
    _input: ConnectAccountingExportEngineInput,
    config: AccountingExportEngineConfiguration,
  ): AccountingExportRunReport {
    const started = Date.now();
    const { reConnected, exConnected, pcConnected, rcConnected, igConnected, rfConnected, txConnected } =
      this.probeConnections();

    const frameworkReg = this.registerWithFramework(config);

    if (this.framework) {
      this.framework.activateFinancialModule(ACCOUNTING_EXPORT_ENGINE_ID);
    }

    const allConnected = reConnected && exConnected && igConnected;
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: allConnected ? "active" : "connected",
      validationStatus: allConnected ? "passed" : "partial",
      revenueEngineConnected: reConnected,
      expenseEngineConnected: exConnected,
      profitCalculationEngineConnected: pcConnected,
      reconciliationEngineConnected: rcConnected,
      invoiceGeneratorConnected: igConnected,
      refundEngineConnected: rfConnected,
      taxIntelligenceEngineConnected: txConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (!reConnected) validation.warnings.push("Revenue Engine not active");
    if (!exConnected) validation.warnings.push("Expense Engine not active");
    if (!igConnected) validation.warnings.push("Invoice Generator not active");
    if (!allConnected) validation.decision = "partial";

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      exportRecords: [],
      packages: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private runExportAction(
    action: AccountingExportRunReport["action"],
    fn: () => {
      exportRecords: ExportRecord[];
      packages: ExportPackage[];
      failures: ExportFailure[];
      error: string | null;
      warnings: string[];
    },
    config: AccountingExportEngineConfiguration,
    eventTopic?: string,
  ): AccountingExportRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Accounting export engine not connected");

    const result = fn();
    const validation = this.validator.validateEngineRecord(engineRecord);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    if (this.framework && result.exportRecords.length > 0 && eventTopic) {
      for (const exportRecord of result.exportRecords) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: ACCOUNTING_EXPORT_ENGINE_ID,
          topic: eventTopic,
          payloadRef: exportRecord.exportRecordId,
        });
      }
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      exportRecords: result.exportRecords,
      packages: result.packages,
      failures: result.failures,
      validation,
      durationMs: Date.now() - started,
    });
  }

  exportFinancialRecords(
    input: ExportFinancialRecordsInput,
    config: AccountingExportEngineConfiguration,
  ): AccountingExportRunReport {
    const exportFormat = input.exportFormat ?? config.defaultExportFormat;
    const exportScope = input.exportScope ?? config.defaultExportScope;

    const requestValidation = this.validator.validateExportRequest(exportFormat, exportScope, config);
    if (requestValidation.decision === "fail") {
      return this.runExportAction(
        "export_records",
        () => ({
          exportRecords: [],
          packages: [],
          failures: [
            this.metadataGenerator.buildFailure(null, requestValidation.errors.join("; "), "high"),
          ],
          error: requestValidation.errors.join("; "),
          warnings: requestValidation.warnings,
        }),
        config,
      );
    }

    const exportKey = `export:${exportFormat}:${exportScope}:${Math.floor(Date.now() / config.exportFrequencyMs)}`;
    if (!input.forceExport && config.exportSchedulingRulesEnabled && this.registry.hasExportKey(exportKey)) {
      return this.runExportAction(
        "export_records",
        () => ({
          exportRecords: [],
          packages: [],
          failures: [],
          error: "Duplicate export within frequency window",
          warnings: [],
        }),
        config,
      );
    }

    if (!this.formatManager.isFormatSupported(exportFormat)) {
      return this.runExportAction(
        "export_records",
        () => ({
          exportRecords: [],
          packages: [],
          failures: [this.metadataGenerator.buildFailure(null, "Unsupported export format", "high")],
          error: "Unsupported export format",
          warnings: [],
        }),
        config,
      );
    }

    return this.runExportAction(
      "export_records",
      () => {
        const snapshot = this.dataSource.filterByScope(
          this.dataSource.snapshot(),
          exportScope,
        );
        const exportRecord = this.exportEngine.buildExportRecord(snapshot, config, {
          exportFormat,
          exportScope,
        });

        const recordValidation = this.validator.validateExportRecord(exportRecord, config);
        if (recordValidation.decision === "fail") {
          const failedRecord: ExportRecord = {
            ...exportRecord,
            exportStatus: "failed",
            validationStatus: "failed",
          };
          this.registry.store(failedRecord, exportKey);
          const failure = this.metadataGenerator.buildFailure(
            failedRecord.exportRecordId,
            recordValidation.errors.join("; "),
            "high",
          );
          this.failures.push(failure);
          return {
            exportRecords: [failedRecord],
            packages: [],
            failures: [failure],
            error: recordValidation.errors.join("; "),
            warnings: [...snapshot.warnings, ...recordValidation.warnings],
          };
        }

        this.registry.store(exportRecord, exportKey);
        appendAeeLog({
          event: "export_generation",
          level: "info",
          details: `Export ${exportRecord.exportRecordId} generated (${exportFormat}/${exportScope}) · ${exportRecord.recordCount} records`,
        });

        return {
          exportRecords: [exportRecord],
          packages: [],
          failures: [],
          error: null,
          warnings: [...snapshot.warnings, ...recordValidation.warnings],
        };
      },
      config,
      "export.generated",
    );
  }

  validateExport(
    input: ValidateExportInput,
    config: AccountingExportEngineConfiguration,
  ): AccountingExportRunReport {
    return this.runExportAction(
      "validate_export",
      () => {
        const target = input.exportRecordId
          ? this.registry.get(input.exportRecordId)
          : this.registry.latest();
        if (!target) {
          return {
            exportRecords: [],
            packages: [],
            failures: [this.metadataGenerator.buildFailure(input.exportRecordId ?? null, "Export record not found", "medium")],
            error: "Export record not found",
            warnings: [],
          };
        }

        const validation = this.validationEngine.validateExportRecord(target, config);
        const updated: ExportRecord = {
          ...target,
          validationStatus: validation.decision === "pass" ? "passed" : validation.decision === "partial" ? "partial" : "failed",
        };
        this.registry.store(updated);

        appendAeeLog({
          event: "export_validation",
          level: validation.decision === "fail" ? "warn" : "info",
          details: `Export ${updated.exportRecordId} validated: ${validation.decision}`,
        });

        return {
          exportRecords: [updated],
          packages: [],
          failures: validation.decision === "fail"
            ? [this.metadataGenerator.buildFailure(updated.exportRecordId, validation.errors.join("; "), "high")]
            : [],
          error: validation.decision === "fail" ? validation.errors.join("; ") : null,
          warnings: validation.warnings,
        };
      },
      config,
      "export.validated",
    );
  }

  detectExportFailures(
    input: DetectExportFailuresInput,
    config: AccountingExportEngineConfiguration,
  ): AccountingExportRunReport {
    return this.runExportAction(
      "detect_failures",
      () => {
        const detected: ExportFailure[] = [];
        const records = input.exportRecordId
          ? [this.registry.get(input.exportRecordId)].filter(Boolean)
          : this.registry.list();

        for (const record of records) {
          if (!record) continue;
          if (record.exportStatus === "failed" || record.validationStatus === "failed") {
            detected.push(
              this.metadataGenerator.buildFailure(
                record.exportRecordId,
                `Export ${record.exportRecordId} failed (${record.exportStatus}/${record.validationStatus})`,
                "high",
              ),
            );
          } else if (record.exportStatus === "partial" || record.validationStatus === "partial") {
            detected.push(
              this.metadataGenerator.buildFailure(
                record.exportRecordId,
                `Export ${record.exportRecordId} partial completion`,
                "medium",
              ),
            );
          }
        }

        for (const failure of detected) {
          if (!this.failures.some((f) => f.exportRecordId === failure.exportRecordId && f.reason === failure.reason)) {
            this.failures.push(failure);
          }
        }

        appendAeeLog({
          event: "export_failure_detection",
          level: detected.length > 0 ? "warn" : "info",
          details: `Detected ${detected.length} export failure(s)`,
        });

        return {
          exportRecords: records.filter(Boolean) as ExportRecord[],
          packages: [],
          failures: detected,
          error: detected.some((f) => f.severity === "high") ? "Export failures detected" : null,
          warnings: [],
        };
      },
      config,
      "export.failed",
    );
  }

  packageExport(
    input: PackageExportInput,
    config: AccountingExportEngineConfiguration,
  ): AccountingExportRunReport {
    return this.runExportAction(
      "package_export",
      () => {
        const target = input.exportRecordId
          ? this.registry.get(input.exportRecordId)
          : this.registry.latest();
        if (!target) {
          return {
            exportRecords: [],
            packages: [],
            failures: [this.metadataGenerator.buildFailure(input.exportRecordId ?? null, "Export record not found", "medium")],
            error: "Export record not found",
            warnings: [],
          };
        }

        const snapshot = this.dataSource.snapshot();
        const content = this.formatManager.format(snapshot, {
          ...target,
          exportFormat: input.exportFormat ?? target.exportFormat,
        });
        const packageValidation = this.validationEngine.validatePackageContent(content, target.recordCount);
        if (packageValidation.decision === "fail") {
          const failure = this.metadataGenerator.buildFailure(
            target.exportRecordId,
            packageValidation.errors.join("; "),
            "high",
          );
          this.failures.push(failure);
          return {
            exportRecords: [target],
            packages: [],
            failures: [failure],
            error: packageValidation.errors.join("; "),
            warnings: packageValidation.warnings,
          };
        }

        const pkg = this.packagingEngine.packageExport(
          target,
          content,
          input.exportFormat ?? target.exportFormat,
        );
        this.packages.set(pkg.packageId, pkg);

        const updated: ExportRecord = { ...target, packageRef: pkg.packageId };
        this.registry.store(updated);

        appendAeeLog({
          event: "export_completion",
          level: "info",
          details: `Package ${pkg.packageId} created for export ${target.exportRecordId}`,
        });

        return {
          exportRecords: [updated],
          packages: [pkg],
          failures: [],
          error: null,
          warnings: packageValidation.warnings,
        };
      },
      config,
    );
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
    this.failures.length = 0;
    this.packages.clear();
  }
}
