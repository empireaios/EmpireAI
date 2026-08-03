/** X2-11 — Cross-Company Resource Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { MultiCompanyRegistry } from "../multi-company-registry/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import type { CrossBusinessKnowledgeEngine } from "../cross-business-knowledge-engine/engine.js";
import type { CapitalDistributionEngine } from "../capital-distribution-engine/engine.js";
import type { PortfolioIntelligenceCertified } from "../portfolio-intelligence-certified/engine.js";
import {
  CCRE_CAPABILITIES,
  CCRE_METADATA_VERSION,
  CROSS_COMPANY_RESOURCE_ENGINE_ID,
} from "./paths.js";
import { appendCcreLog } from "./ccre-logging.js";
import { EnterpriseResourceRegistry } from "./enterprise-resource-registry.js";
import { ResourceAllocationEngine } from "./resource-allocation-engine.js";
import { ResourceOptimizationEngine } from "./resource-optimization-engine.js";
import { ResourceConflictDetector } from "./resource-conflict-detector.js";
import { ResourceRecommendationEngine } from "./resource-recommendation-engine.js";
import { ResourceValidator } from "./resource-validator.js";
import { ResourceMetadataGenerator } from "./resource-metadata-generator.js";
import type { CrossCompanyResourceEngineConfiguration } from "./configuration.js";
import type {
  AllocateResourceInput,
  ConnectCrossCompanyResourceInput,
  DetectIdleResourcesInput,
  DetectResourceConflictsInput,
  OptimizeResourcesInput,
  RecommendResourceInput,
  RegisterResourceInput,
  ResourceConflictSignal,
  ResourceEngineRecord,
  ResourceRunReport,
  RunResourceDiagnosticsInput,
} from "./types.js";

export type CrossCompanyResourceEngineDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  multiCompanyRegistry: MultiCompanyRegistry | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
  crossBusinessKnowledgeEngine: CrossBusinessKnowledgeEngine | null;
  capitalDistributionEngine: CapitalDistributionEngine | null;
  portfolioIntelligenceCertified: PortfolioIntelligenceCertified | null;
};

export class CrossCompanyResourceManager {
  private engineRecord: ResourceEngineRecord | null = null;
  private latestConflicts: ResourceConflictSignal[] = [];
  private readonly registry = new EnterpriseResourceRegistry();
  private readonly allocationEngine = new ResourceAllocationEngine(this.registry);
  private readonly optimizationEngine = new ResourceOptimizationEngine(this.registry);
  private readonly conflictDetector = new ResourceConflictDetector();
  private readonly recommendations = new ResourceRecommendationEngine();
  private readonly validator = new ResourceValidator();
  private readonly metadataGenerator = new ResourceMetadataGenerator();

  constructor(private readonly deps: CrossCompanyResourceEngineDependencies) {}

  getEngineRecord(): ResourceEngineRecord | null {
    return this.engineRecord;
  }

  getResourceRecords() {
    return this.registry.list();
  }

  idleCount(): number {
    return this.registry.list().filter((r) => r.allocationStatus === "idle").length;
  }

  conflictCount(): number {
    return this.latestConflicts.length;
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.latestConflicts = [];
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

  private dependencyPresence(): ResourceEngineRecord["dependencyPresence"] {
    return {
      enterprisePortfolioFramework: this.deps.enterprisePortfolioFramework
        ? this.probe(() => this.deps.enterprisePortfolioFramework!.getState())
        : false,
      multiCompanyRegistry: this.deps.multiCompanyRegistry
        ? this.probe(() => this.deps.multiCompanyRegistry!.getState())
        : false,
      portfolioPerformanceEngine: this.deps.portfolioPerformanceEngine
        ? this.probe(() => this.deps.portfolioPerformanceEngine!.getState())
        : false,
      crossBusinessKnowledgeEngine: this.deps.crossBusinessKnowledgeEngine
        ? this.probe(() => this.deps.crossBusinessKnowledgeEngine!.getState())
        : false,
      capitalDistributionEngine: this.deps.capitalDistributionEngine
        ? this.probe(() => this.deps.capitalDistributionEngine!.getState())
        : false,
      portfolioIntelligenceCertified: this.deps.portfolioIntelligenceCertified
        ? this.probe(() => this.deps.portfolioIntelligenceCertified!.getState())
        : false,
    };
  }

  private requireConnected(): ResourceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Cross-Company Resource Engine not connected — call connectCrossCompanyResourceEngine first",
      );
    }
    return this.engineRecord;
  }

  private failReport(
    action: ResourceRunReport["action"],
    errors: string[],
    durationMs: number,
  ): ResourceRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "ccre-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: CROSS_COMPANY_RESOURCE_ENGINE_ID,
        engineVersion: "PILLOW-CCRE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...CCRE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: CCRE_METADATA_VERSION,
      } satisfies ResourceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `ccre-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: CCRE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(
    config: CrossCompanyResourceEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: ResourceRunReport["validation"] } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: CROSS_COMPANY_RESOURCE_ENGINE_ID,
        moduleVersion: CCRE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-11",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "resource.registered",
            "resource.allocated",
            "resource.conflict",
            "resource.optimized",
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
        CROSS_COMPANY_RESOURCE_ENGINE_ID,
      );
    }

    appendCcreLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Cross-Company Resource Engine with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `ccre-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: CCRE_METADATA_VERSION,
      },
    };
  }

  connectCrossCompanyResourceEngine(
    _input: ConnectCrossCompanyResourceInput,
    config: CrossCompanyResourceEngineConfiguration,
  ): ResourceRunReport {
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
      presence.capitalDistributionEngine;

    this.engineRecord = {
      engineRecordId: `ccre-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      currentOperationalState: "connected",
      engineId: CROSS_COMPANY_RESOURCE_ENGINE_ID,
      engineVersion: "PILLOW-CCRE-001",
      healthStatus: corePresent ? (connectedCount === 6 ? "healthy" : "degraded") : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...CCRE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: CCRE_METADATA_VERSION,
    };

    appendCcreLog({
      event: "engine_connected",
      level: "info",
      details: "Cross-Company Resource Engine connected",
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

  registerResource(
    input: RegisterResourceInput,
    config: CrossCompanyResourceEngineConfiguration,
  ): ResourceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateRegister(input, config);
      if (validation.decision === "fail") {
        return this.failReport("register_resource", validation.errors, Date.now() - started);
      }

      const record = this.registry.register({
        resourceIdentifier: input.resourceIdentifier,
        resourceCategory: input.resourceCategory,
        owningCompany: input.owningCompany,
        utilizationScore: input.utilizationScore ?? 50,
        protectedResource: input.protectedResource === true,
        authorizedAllocation: input.authorizedAllocation === true,
      });
      const recordValidation = this.validator.validateRecord(record);
      engineRecord.currentOperationalState = "active";

      return this.metadataGenerator.buildRunReport({
        action: "register_resource",
        engineRecord,
        resourceRecords: [record],
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
        "register_resource",
        [error instanceof Error ? error.message : "Registration failed"],
        Date.now() - started,
      );
    }
  }

  allocateResource(
    input: AllocateResourceInput,
    config: CrossCompanyResourceEngineConfiguration,
  ): ResourceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateAllocate(input, config);
      if (validation.decision === "fail") {
        return this.failReport("allocate_resource", validation.errors, Date.now() - started);
      }

      const result = this.allocationEngine.allocate({
        resourceIdentifier: input.resourceIdentifier,
        assignedCompany: input.assignedCompany,
        utilizationScore: input.utilizationScore,
        authorizedAllocation: input.authorizedAllocation,
        config,
      });
      if (!result.record) {
        return this.failReport(
          "allocate_resource",
          result.errors.length ? result.errors : ["Allocation failed"],
          Date.now() - started,
        );
      }

      engineRecord.currentOperationalState = "active";
      return this.metadataGenerator.buildRunReport({
        action: "allocate_resource",
        engineRecord,
        resourceRecords: [result.record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "allocate_resource",
        [error instanceof Error ? error.message : "Allocation failure"],
        Date.now() - started,
      );
    }
  }

  detectIdleResources(
    _input: DetectIdleResourcesInput,
    config: CrossCompanyResourceEngineConfiguration,
  ): ResourceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const idle = this.optimizationEngine.detectIdle(this.registry.list(), config);
      return this.metadataGenerator.buildRunReport({
        action: "detect_idle",
        engineRecord,
        resourceRecords: idle,
        validation: {
          validationReportId: `ccre-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: idle.length === 0 ? ["No idle resources detected"] : [],
          durationMs: Date.now() - started,
          metadataVersion: CCRE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "detect_idle",
        [error instanceof Error ? error.message : "Idle detection failed"],
        Date.now() - started,
      );
    }
  }

  detectConflicts(
    _input: DetectResourceConflictsInput,
    config: CrossCompanyResourceEngineConfiguration,
  ): ResourceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      this.latestConflicts = this.conflictDetector.detect(this.registry.list(), config);
      appendCcreLog({
        event: "conflict_detection",
        level: this.latestConflicts.length ? "warn" : "info",
        details: `Conflicts detected: ${this.latestConflicts.length}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_conflicts",
        engineRecord,
        resourceRecords: this.registry.list(),
        conflictSignals: this.latestConflicts,
        validation: {
          validationReportId: `ccre-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: this.latestConflicts.some((c) => c.severity === "high")
            ? "partial"
            : "pass",
          errors: [],
          warnings: this.latestConflicts.map((c) => c.rationale),
          durationMs: Date.now() - started,
          metadataVersion: CCRE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "detect_conflicts",
        [error instanceof Error ? error.message : "Conflict detection failed"],
        Date.now() - started,
      );
    }
  }

  optimizeResources(
    _input: OptimizeResourcesInput,
    config: CrossCompanyResourceEngineConfiguration,
  ): ResourceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      this.optimizationEngine.detectIdle(this.registry.list(), config);
      const optimized = this.optimizationEngine.optimize(this.registry.list(), config);
      this.latestConflicts = this.conflictDetector.detect(this.registry.list(), config);
      const recs = this.recommendations.recommend({
        records: this.registry.list(),
        conflicts: this.latestConflicts,
      });
      return this.metadataGenerator.buildRunReport({
        action: "optimize",
        engineRecord,
        resourceRecords: optimized.length ? optimized : this.registry.list(),
        conflictSignals: this.latestConflicts,
        recommendations: recs,
        validation: {
          validationReportId: `ccre-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.optimizationRulesEnabled ? "pass" : "partial",
          errors: [],
          warnings: config.optimizationRulesEnabled
            ? []
            : ["Optimization rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: CCRE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "optimize",
        [error instanceof Error ? error.message : "Optimization failure"],
        Date.now() - started,
      );
    }
  }

  generateRecommendations(
    input: RecommendResourceInput,
    _config: CrossCompanyResourceEngineConfiguration,
  ): ResourceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const recs = this.recommendations.recommend({
        records: this.registry.list(),
        conflicts: this.latestConflicts,
        companyReference: input.companyReference,
        resourceIdentifier: input.resourceIdentifier,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend",
        engineRecord,
        resourceRecords: this.registry.list(),
        conflictSignals: this.latestConflicts,
        recommendations: recs,
        validation: {
          validationReportId: `ccre-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CCRE_METADATA_VERSION,
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

  runDiagnostics(
    input: RunResourceDiagnosticsInput,
    config: CrossCompanyResourceEngineConfiguration,
  ): ResourceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const records = input.companyReference
        ? this.registry.listByCompany(input.companyReference)
        : this.registry.list();
      this.latestConflicts = this.conflictDetector.detect(records, config);
      const recs = this.recommendations.recommend({
        records,
        conflicts: this.latestConflicts,
        companyReference: input.companyReference,
      });
      appendCcreLog({
        event: "diagnostics",
        level: "info",
        details: `Diagnostics resources=${records.length} conflicts=${this.latestConflicts.length}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        resourceRecords: records,
        conflictSignals: this.latestConflicts,
        recommendations: recs,
        validation: {
          validationReportId: `ccre-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CCRE_METADATA_VERSION,
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
