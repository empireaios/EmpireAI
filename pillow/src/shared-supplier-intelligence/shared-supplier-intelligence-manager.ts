/** X2-13 — Shared Supplier Intelligence Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { MultiCompanyRegistry } from "../multi-company-registry/engine.js";
import type { CrossBusinessKnowledgeEngine } from "../cross-business-knowledge-engine/engine.js";
import type { CrossCompanyResourceEngine } from "../cross-company-resource-engine/engine.js";
import type { SupplierFrameworkEngine } from "../supplier-framework/engine.js";
import type { SupplierOperationsCertificationEngine } from "../supplier-operations-certification/engine.js";
import {
  SSI_CAPABILITIES,
  SSI_METADATA_VERSION,
  SHARED_SUPPLIER_INTELLIGENCE_ID,
} from "./paths.js";
import { appendSsiLog } from "./ssi-logging.js";
import { EnterpriseSupplierRegistry } from "./enterprise-supplier-registry.js";
import { SupplierPerformanceEngine } from "./supplier-performance-engine.js";
import { SupplierRiskEngine } from "./supplier-risk-engine.js";
import { SupplierIntelligenceEngine } from "./supplier-intelligence-engine.js";
import { SupplierRecommendationEngine } from "./supplier-recommendation-engine.js";
import { SupplierIntelligenceValidator } from "./supplier-intelligence-validator.js";
import { SupplierIntelligenceMetadataGenerator } from "./supplier-intelligence-metadata-generator.js";
import type { SharedSupplierIntelligenceConfiguration } from "./configuration.js";
import type {
  ConnectSharedSupplierIntelligenceInput,
  ConsolidateSupplierKnowledgeInput,
  DetectSupplierDuplicatesInput,
  DetectSupplierRisksInput,
  RecommendSupplierInput,
  RunSupplierIntelligenceDiagnosticsInput,
  ShareSupplierIntelligenceInput,
  SupplierIntelligenceEngineRecord,
  SupplierIntelligenceRunReport,
  SupplierRiskSignal,
  TrackSupplierPerformanceInput,
} from "./types.js";

export type SharedSupplierIntelligenceDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  multiCompanyRegistry: MultiCompanyRegistry | null;
  crossBusinessKnowledgeEngine: CrossBusinessKnowledgeEngine | null;
  crossCompanyResourceEngine: CrossCompanyResourceEngine | null;
  supplierFramework: SupplierFrameworkEngine | null;
  supplierOperationsCertification: SupplierOperationsCertificationEngine | null;
};

export class SharedSupplierIntelligenceManager {
  private engineRecord: SupplierIntelligenceEngineRecord | null = null;
  private latestRisks: SupplierRiskSignal[] = [];
  private readonly registry = new EnterpriseSupplierRegistry();
  private readonly performanceEngine = new SupplierPerformanceEngine(this.registry);
  private readonly riskEngine = new SupplierRiskEngine(this.registry);
  private readonly intelligenceEngine = new SupplierIntelligenceEngine(this.registry);
  private readonly recommendations = new SupplierRecommendationEngine();
  private readonly validator = new SupplierIntelligenceValidator();
  private readonly metadataGenerator = new SupplierIntelligenceMetadataGenerator();

  constructor(private readonly deps: SharedSupplierIntelligenceDependencies) {}

  getEngineRecord(): SupplierIntelligenceEngineRecord | null {
    return this.engineRecord;
  }

  getIntelligenceRecords() {
    return this.registry.list();
  }

  sharedCount(): number {
    return this.registry.list().filter((r) => r.sharedAcrossCompanies).length;
  }

  highRiskCount(): number {
    return this.latestRisks.filter((r) => r.severity === "high").length;
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.latestRisks = [];
    this.registry.resetForTesting();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): SupplierIntelligenceEngineRecord["dependencyPresence"] {
    return {
      enterprisePortfolioFramework: this.deps.enterprisePortfolioFramework
        ? this.probe(() => this.deps.enterprisePortfolioFramework!.getState())
        : false,
      multiCompanyRegistry: this.deps.multiCompanyRegistry
        ? this.probe(() => this.deps.multiCompanyRegistry!.getState())
        : false,
      crossBusinessKnowledgeEngine: this.deps.crossBusinessKnowledgeEngine
        ? this.probe(() => this.deps.crossBusinessKnowledgeEngine!.getState())
        : false,
      crossCompanyResourceEngine: this.deps.crossCompanyResourceEngine
        ? this.probe(() => this.deps.crossCompanyResourceEngine!.getState())
        : false,
      supplierFramework: this.deps.supplierFramework
        ? this.probe(() => this.deps.supplierFramework!.getState())
        : false,
      supplierOperationsCertification: this.deps.supplierOperationsCertification
        ? this.probe(() => this.deps.supplierOperationsCertification!.getState())
        : false,
    };
  }

  private requireConnected(): SupplierIntelligenceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Shared Supplier Intelligence not connected — call connectSharedSupplierIntelligence first",
      );
    }
    return this.engineRecord;
  }

  private defaultCompanies(): string[] {
    if (!this.deps.multiCompanyRegistry) return [];
    try {
      return this.deps.multiCompanyRegistry
        .getCompanyRecords()
        .map((c) => c.companyId)
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  private failReport(
    action: SupplierIntelligenceRunReport["action"],
    errors: string[],
    durationMs: number,
  ): SupplierIntelligenceRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "ssi-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: SHARED_SUPPLIER_INTELLIGENCE_ID,
        engineVersion: "PILLOW-SSI-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...SSI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: SSI_METADATA_VERSION,
      } satisfies SupplierIntelligenceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `ssi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: SSI_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(
    config: SharedSupplierIntelligenceConfiguration,
  ): {
    frameworkModuleId: string | null;
    validation: SupplierIntelligenceRunReport["validation"];
  } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: SHARED_SUPPLIER_INTELLIGENCE_ID,
        moduleVersion: SSI_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-13",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "supplier.synchronized",
            "supplier.performance",
            "supplier.risk",
            "supplier.recommended",
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
          "portfolio_event_routing",
          "portfolio_validation",
          "diagnostics",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.enterprisePortfolioFramework.activatePortfolioModule(
        SHARED_SUPPLIER_INTELLIGENCE_ID,
      );
    }

    appendSsiLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Shared Supplier Intelligence with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `ssi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: SSI_METADATA_VERSION,
      },
    };
  }

  connectSharedSupplierIntelligence(
    _input: ConnectSharedSupplierIntelligenceInput,
    config: SharedSupplierIntelligenceConfiguration,
  ): SupplierIntelligenceRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const connectedCount = Object.values(presence).filter(Boolean).length;
    const corePresent =
      presence.enterprisePortfolioFramework &&
      presence.multiCompanyRegistry &&
      presence.crossBusinessKnowledgeEngine;

    this.engineRecord = {
      engineRecordId: `ssi-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SHARED_SUPPLIER_INTELLIGENCE_ID,
      engineVersion: "PILLOW-SSI-001",
      currentOperationalState: "connected",
      healthStatus: corePresent ? (connectedCount >= 5 ? "healthy" : "degraded") : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...SSI_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: SSI_METADATA_VERSION,
    };

    appendSsiLog({
      event: "engine_connected",
      level: "info",
      details: "Shared Supplier Intelligence connected",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
    ];

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: this.engineRecord,
      validation: {
        ...framework.validation,
        warnings,
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

  consolidateSupplierKnowledge(
    input: ConsolidateSupplierKnowledgeInput,
    config: SharedSupplierIntelligenceConfiguration,
  ): SupplierIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateConsolidate(input, config);
      if (validation.decision === "fail") {
        return this.failReport("consolidate_knowledge", validation.errors, Date.now() - started);
      }

      const companies =
        input.companyReferences?.length
          ? input.companyReferences
          : this.defaultCompanies().slice(0, 1);
      const record = this.registry.upsert({
        supplierReference: input.supplierReference,
        associatedCompanies: companies,
        supplierPerformanceScore: input.performanceScore ?? 55,
        reliabilityScore: input.reliabilityScore ?? 55,
        costCompetitivenessScore: input.costCompetitivenessScore ?? 55,
        recommendationSummary: "Supplier consolidated — pending optimization",
        riskLevel: "low",
        duplicateDetected: false,
        sharedAcrossCompanies: companies.length > 1,
      });
      const recordValidation = this.validator.validateRecord(record);
      engineRecord.currentOperationalState = "active";

      return this.metadataGenerator.buildRunReport({
        action: "consolidate_knowledge",
        engineRecord,
        intelligenceRecords: [record],
        validation: {
          ...validation,
          errors: [...validation.errors, ...recordValidation.errors],
          warnings: [...validation.warnings, ...recordValidation.warnings],
          decision:
            recordValidation.decision === "fail"
              ? "fail"
              : validation.decision === "partial" || recordValidation.decision === "partial"
                ? "partial"
                : validation.decision,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "consolidate_knowledge",
        [error instanceof Error ? error.message : "Consolidation failed"],
        Date.now() - started,
      );
    }
  }

  trackSupplierPerformance(
    input: TrackSupplierPerformanceInput,
    config: SharedSupplierIntelligenceConfiguration,
  ): SupplierIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validatePerformance(input, config);
      if (validation.decision === "fail") {
        return this.failReport("track_performance", validation.errors, Date.now() - started);
      }
      if (!this.registry.get(input.supplierReference)) {
        this.registry.upsert({
          supplierReference: input.supplierReference,
          associatedCompanies: this.defaultCompanies().slice(0, 1),
          supplierPerformanceScore: 50,
          reliabilityScore: 50,
          costCompetitivenessScore: 50,
          recommendationSummary: "Auto-registered for performance tracking",
          riskLevel: "low",
          duplicateDetected: false,
          sharedAcrossCompanies: false,
        });
      }
      const record = this.performanceEngine.track(input);
      return this.metadataGenerator.buildRunReport({
        action: "track_performance",
        engineRecord,
        intelligenceRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "track_performance",
        [error instanceof Error ? error.message : "Performance calculation failure"],
        Date.now() - started,
      );
    }
  }

  detectSupplierRisks(
    input: DetectSupplierRisksInput,
    config: SharedSupplierIntelligenceConfiguration,
  ): SupplierIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const source = input.supplierReference
        ? this.registry.get(input.supplierReference)
          ? [this.registry.get(input.supplierReference)!]
          : []
        : this.registry.list();
      this.latestRisks = this.riskEngine.detect(source, config);
      return this.metadataGenerator.buildRunReport({
        action: "detect_risks",
        engineRecord,
        intelligenceRecords: this.registry.list(),
        riskSignals: this.latestRisks,
        validation: {
          validationReportId: `ssi-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: this.latestRisks.some((r) => r.severity === "high") ? "partial" : "pass",
          errors: [],
          warnings: this.latestRisks.map((r) => r.rationale),
          durationMs: Date.now() - started,
          metadataVersion: SSI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "detect_risks",
        [error instanceof Error ? error.message : "Risk detection failure"],
        Date.now() - started,
      );
    }
  }

  detectSupplierDuplicates(
    _input: DetectSupplierDuplicatesInput,
    _config: SharedSupplierIntelligenceConfiguration,
  ): SupplierIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const result = this.riskEngine.detectDuplicates(this.registry.list());
      this.latestRisks = [...this.latestRisks, ...result.signals];
      return this.metadataGenerator.buildRunReport({
        action: "detect_duplicates",
        engineRecord,
        intelligenceRecords: result.updated.length ? result.updated : this.registry.list(),
        riskSignals: result.signals,
        validation: {
          validationReportId: `ssi-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings:
            result.signals.length === 0
              ? ["No supplier duplicates detected"]
              : result.signals.map((s) => s.rationale),
          durationMs: Date.now() - started,
          metadataVersion: SSI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "detect_duplicates",
        [error instanceof Error ? error.message : "Duplicate detection failure"],
        Date.now() - started,
      );
    }
  }

  generateRecommendations(
    input: RecommendSupplierInput,
    config: SharedSupplierIntelligenceConfiguration,
  ): SupplierIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      this.intelligenceEngine.summarizeOptimal(this.registry.list(), config);
      const recs = this.recommendations.recommend({
        records: this.registry.list(),
        risks: this.latestRisks,
        config,
        supplierReference: input.supplierReference,
        companyReference: input.companyReference,
      });
      appendSsiLog({
        event: "supplier_recommendations",
        level: "info",
        details: `Recommendations generated: ${recs.length}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend",
        engineRecord,
        intelligenceRecords: this.registry.list(),
        riskSignals: this.latestRisks,
        recommendations: recs,
        validation: {
          validationReportId: `ssi-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: SSI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "recommend",
        [error instanceof Error ? error.message : "Recommendation failure"],
        Date.now() - started,
      );
    }
  }

  shareSupplierIntelligence(
    input: ShareSupplierIntelligenceInput,
    config: SharedSupplierIntelligenceConfiguration,
  ): SupplierIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateShare(input, config);
      if (validation.decision === "fail") {
        return this.failReport("share_intelligence", validation.errors, Date.now() - started);
      }
      const record = this.intelligenceEngine.share({
        supplierReference: input.supplierReference,
        targetCompanies: input.targetCompanies,
        config,
      });
      if (!record) {
        return this.failReport(
          "share_intelligence",
          ["Supplier not found or sharing disabled"],
          Date.now() - started,
        );
      }
      return this.metadataGenerator.buildRunReport({
        action: "share_intelligence",
        engineRecord,
        intelligenceRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "share_intelligence",
        [error instanceof Error ? error.message : "Share synchronization failure"],
        Date.now() - started,
      );
    }
  }

  runDiagnostics(
    input: RunSupplierIntelligenceDiagnosticsInput,
    config: SharedSupplierIntelligenceConfiguration,
  ): SupplierIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const records = input.supplierReference
        ? this.registry.get(input.supplierReference)
          ? [this.registry.get(input.supplierReference)!]
          : []
        : this.registry.list();
      this.latestRisks = this.riskEngine.detect(records, config);
      const dupes = this.riskEngine.detectDuplicates(records);
      this.latestRisks = [...this.latestRisks, ...dupes.signals];
      const recs = this.recommendations.recommend({
        records: this.registry.list(),
        risks: this.latestRisks,
        config,
        supplierReference: input.supplierReference,
      });
      appendSsiLog({
        event: "diagnostics",
        level: "info",
        details: `Diagnostics records=${records.length} risks=${this.latestRisks.length}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        intelligenceRecords: this.registry.list(),
        riskSignals: this.latestRisks,
        recommendations: recs,
        validation: {
          validationReportId: `ssi-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: SSI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "diagnostics",
        [error instanceof Error ? error.message : "Diagnostics failure"],
        Date.now() - started,
      );
    }
  }
}
