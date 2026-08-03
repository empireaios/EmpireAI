/** X2-04 — Cross-Business Knowledge Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { MultiCompanyRegistry } from "../multi-company-registry/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import {
  CBK_CAPABILITIES,
  CBK_METADATA_VERSION,
  CROSS_BUSINESS_KNOWLEDGE_ENGINE_ID,
} from "./paths.js";
import { appendCbkLog } from "./cbk-logging.js";
import { EnterpriseKnowledgeRepository } from "./enterprise-knowledge-repository.js";
import { KnowledgeCollectionEngine } from "./knowledge-collection-engine.js";
import { KnowledgeClassificationEngine } from "./knowledge-classification-engine.js";
import { KnowledgeSharingEngine } from "./knowledge-sharing-engine.js";
import { KnowledgeRecommendationEngine } from "./knowledge-recommendation-engine.js";
import { KnowledgeValidator } from "./knowledge-validator.js";
import { KnowledgeMetadataGenerator } from "./knowledge-metadata-generator.js";
import type { CrossBusinessKnowledgeEngineConfiguration } from "./configuration.js";
import type {
  ClassifyKnowledgeInput,
  CollectKnowledgeInput,
  ConnectCrossBusinessKnowledgeInput,
  DetectDuplicateKnowledgeInput,
  KnowledgeEngineRecord,
  KnowledgeRunReport,
  RankKnowledgeInput,
  RecommendKnowledgeInput,
  RunKnowledgeDiagnosticsInput,
  ShareKnowledgeInput,
} from "./types.js";

export type CrossBusinessKnowledgeEngineDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  multiCompanyRegistry: MultiCompanyRegistry | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
};

export class CrossBusinessKnowledgeManager {
  private engineRecord: KnowledgeEngineRecord | null = null;
  private readonly repository = new EnterpriseKnowledgeRepository();
  private readonly collection: KnowledgeCollectionEngine;
  private readonly classification: KnowledgeClassificationEngine;
  private readonly sharing: KnowledgeSharingEngine;
  private readonly recommendations: KnowledgeRecommendationEngine;
  private readonly validator = new KnowledgeValidator();
  private readonly metadataGenerator = new KnowledgeMetadataGenerator();

  constructor(private readonly deps: CrossBusinessKnowledgeEngineDependencies) {
    this.collection = new KnowledgeCollectionEngine(this.repository);
    this.classification = new KnowledgeClassificationEngine(this.repository);
    this.sharing = new KnowledgeSharingEngine(this.repository);
    this.recommendations = new KnowledgeRecommendationEngine(this.repository);
  }

  getEngineRecord(): KnowledgeEngineRecord | null {
    return this.engineRecord;
  }

  getKnowledgeRecords() {
    return this.repository.list();
  }

  sharedKnowledgeCount(): number {
    return this.repository.sharedCount();
  }

  duplicateSignalCount(): number {
    return this.repository.findDuplicates().length;
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): KnowledgeEngineRecord["dependencyPresence"] {
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
    };
  }

  private requireConnected(): KnowledgeEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Cross-Business Knowledge Engine not connected — call connectCrossBusinessKnowledgeEngine first",
      );
    }
    return this.engineRecord;
  }

  private failReport(
    action: KnowledgeRunReport["action"],
    errors: string[],
    durationMs: number,
  ): KnowledgeRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "cbk-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: CROSS_BUSINESS_KNOWLEDGE_ENGINE_ID,
        engineVersion: "PILLOW-CBK-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...CBK_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: CBK_METADATA_VERSION,
      } satisfies KnowledgeEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      knowledgeRecords: [],
      validation: {
        validationReportId: `cbk-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: CBK_METADATA_VERSION,
      },
      durationMs,
    });
  }

  private registryCompanyIds(): string[] {
    if (!this.deps.multiCompanyRegistry) return [];
    try {
      return this.deps.multiCompanyRegistry.getCompanyRecords().map((c) => c.companyId);
    } catch {
      return [];
    }
  }

  registerWithFramework(
    config: CrossBusinessKnowledgeEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: KnowledgeRunReport["validation"] } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: CROSS_BUSINESS_KNOWLEDGE_ENGINE_ID,
        moduleVersion: CBK_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-04",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "knowledge.collected",
            "knowledge.classified",
            "knowledge.shared",
            "knowledge.recommended",
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
        CROSS_BUSINESS_KNOWLEDGE_ENGINE_ID,
      );
    }

    appendCbkLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Cross-Business Knowledge Engine with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `cbk-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: CBK_METADATA_VERSION,
      },
    };
  }

  connectCrossBusinessKnowledgeEngine(
    _input: ConnectCrossBusinessKnowledgeInput,
    config: CrossBusinessKnowledgeEngineConfiguration,
  ): KnowledgeRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const allPresent =
      presence.enterprisePortfolioFramework &&
      presence.multiCompanyRegistry &&
      presence.portfolioPerformanceEngine;

    this.engineRecord = {
      engineRecordId: `cbk-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: CROSS_BUSINESS_KNOWLEDGE_ENGINE_ID,
      engineVersion: "PILLOW-CBK-001",
      currentOperationalState: "connected",
      healthStatus: allPresent ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...CBK_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: CBK_METADATA_VERSION,
    };

    appendCbkLog({
      event: "engine_connected",
      level: "info",
      details: "Cross-Business Knowledge Engine connected",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...(presence.enterprisePortfolioFramework ? [] : ["EPF dependency unavailable"]),
      ...(presence.multiCompanyRegistry ? [] : ["Multi-Company Registry dependency unavailable"]),
      ...(presence.portfolioPerformanceEngine
        ? []
        : ["Portfolio Performance Engine dependency unavailable"]),
    ];

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: this.engineRecord,
      knowledgeRecords: this.repository.list(),
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

  collectKnowledge(
    input: CollectKnowledgeInput,
    config: CrossBusinessKnowledgeEngineConfiguration,
  ): KnowledgeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateCollect(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "collect_knowledge",
          engineRecord,
          knowledgeRecords: [],
          validation,
          durationMs: Date.now() - started,
        });
      }

      if (this.repository.list().length >= config.maxKnowledgeRecords) {
        validation.decision = "fail";
        validation.errors.push("Maximum knowledge records reached");
        return this.metadataGenerator.buildRunReport({
          action: "collect_knowledge",
          engineRecord,
          knowledgeRecords: [],
          validation,
          durationMs: Date.now() - started,
        });
      }

      const category = input.knowledgeCategory ?? "general";
      const existing = this.repository.findByIdentity(
        input.sourceCompany,
        input.knowledgeSummary,
        category,
      );
      if (existing && !input.allowDuplicate) {
        validation.decision = "fail";
        validation.errors.push(
          "Duplicate knowledge detected — set allowDuplicate=true with validation to proceed",
        );
        return this.metadataGenerator.buildRunReport({
          action: "collect_knowledge",
          engineRecord,
          knowledgeRecords: [existing],
          validation,
          durationMs: Date.now() - started,
        });
      }

      if (existing && input.allowDuplicate) {
        validation.warnings.push("Duplicate knowledge accepted under validated allowDuplicate");
      }

      const record = this.collection.collect(input);
      const recordValidation = this.validator.validateRecord(record);
      if (recordValidation.decision === "fail") {
        validation.decision = "fail";
        validation.errors.push(...recordValidation.errors);
      } else if (validation.warnings.length > 0) {
        validation.decision = "partial";
      }

      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      return this.metadataGenerator.buildRunReport({
        action: "collect_knowledge",
        engineRecord,
        knowledgeRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "collect_knowledge",
        [error instanceof Error ? error.message : "Knowledge collection failed"],
        Date.now() - started,
      );
    }
  }

  classifyKnowledge(
    input: ClassifyKnowledgeInput,
    config: CrossBusinessKnowledgeEngineConfiguration,
  ): KnowledgeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateClassify(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "classify_knowledge",
          engineRecord,
          knowledgeRecords: [],
          validation,
          durationMs: Date.now() - started,
        });
      }
      const record = this.classification.classify(input);
      return this.metadataGenerator.buildRunReport({
        action: "classify_knowledge",
        engineRecord,
        knowledgeRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "classify_knowledge",
        [error instanceof Error ? error.message : "Classification failed"],
        Date.now() - started,
      );
    }
  }

  shareKnowledge(
    input: ShareKnowledgeInput,
    config: CrossBusinessKnowledgeEngineConfiguration,
  ): KnowledgeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateShare(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "share_knowledge",
          engineRecord,
          knowledgeRecords: [],
          validation,
          durationMs: Date.now() - started,
        });
      }

      const targets = input.targetCompanies?.length
        ? input.targetCompanies
        : this.registryCompanyIds();
      const record = this.sharing.share(input, targets);
      return this.metadataGenerator.buildRunReport({
        action: "share_knowledge",
        engineRecord,
        knowledgeRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "share_knowledge",
        [error instanceof Error ? error.message : "Knowledge sharing failed"],
        Date.now() - started,
      );
    }
  }

  detectDuplicates(
    input: DetectDuplicateKnowledgeInput,
    _config: CrossBusinessKnowledgeEngineConfiguration,
  ): KnowledgeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const duplicates = this.repository.findDuplicates(input.knowledgeRecordId);
      const warnings =
        duplicates.length > 0
          ? [`Detected ${duplicates.length} duplicate learning signal(s)`]
          : [];
      appendCbkLog({
        event: "duplicate_learning_detection",
        level: duplicates.length > 0 ? "warn" : "info",
        details:
          duplicates.length > 0
            ? `Duplicates: ${duplicates.map((d) => d.knowledgeRecordId).join(", ")}`
            : "No duplicate learning detected",
      });
      return this.metadataGenerator.buildRunReport({
        action: "detect_duplicates",
        engineRecord,
        knowledgeRecords: duplicates,
        validation: {
          validationReportId: `cbk-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: duplicates.length > 0 ? "partial" : "pass",
          errors: [],
          warnings,
          durationMs: Date.now() - started,
          metadataVersion: CBK_METADATA_VERSION,
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

  rankKnowledge(
    input: RankKnowledgeInput,
    config: CrossBusinessKnowledgeEngineConfiguration,
  ): KnowledgeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const errors: string[] = [];
      const warnings: string[] = [];
      if (input.validated !== true) errors.push("Knowledge ranking requires validated=true");
      if (!config.knowledgeRankingRulesEnabled) warnings.push("Knowledge ranking rules disabled");

      const records = this.repository.list();
      if (records.length === 0) errors.push("Missing company knowledge — no records to rank");

      if (errors.length > 0) {
        return this.metadataGenerator.buildRunReport({
          action: "rank_knowledge",
          engineRecord,
          knowledgeRecords: [],
          validation: {
            validationReportId: `cbk-val-${Date.now()}`,
            validationTimestamp: new Date().toISOString(),
            decision: "fail",
            errors,
            warnings,
            durationMs: Date.now() - started,
            metadataVersion: CBK_METADATA_VERSION,
          },
          durationMs: Date.now() - started,
        });
      }

      const ranked = [...records]
        .sort(
          (a, b) =>
            b.reusabilityScore * 0.6 +
            b.confidenceScore * 0.4 -
            (a.reusabilityScore * 0.6 + a.confidenceScore * 0.4),
        )
        .map((record, index) => {
          record.ranking = index + 1;
          return this.repository.upsert(record);
        });

      appendCbkLog({
        event: "knowledge_ranking",
        level: "info",
        details: `Ranked ${ranked.length} knowledge asset(s)`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "rank_knowledge",
        engineRecord,
        knowledgeRecords: ranked,
        validation: {
          validationReportId: `cbk-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: warnings.length > 0 ? "partial" : "pass",
          errors: [],
          warnings,
          durationMs: Date.now() - started,
          metadataVersion: CBK_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "rank_knowledge",
        [error instanceof Error ? error.message : "Knowledge ranking failed"],
        Date.now() - started,
      );
    }
  }

  generateRecommendations(
    input: RecommendKnowledgeInput,
    _config: CrossBusinessKnowledgeEngineConfiguration,
  ): KnowledgeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const recommendations = this.recommendations.recommend(input);
      const records = input.knowledgeRecordId
        ? [this.repository.get(input.knowledgeRecordId)].filter(Boolean)
        : this.repository.list();
      return this.metadataGenerator.buildRunReport({
        action: "recommend",
        engineRecord,
        knowledgeRecords: records as ReturnType<EnterpriseKnowledgeRepository["list"]>,
        recommendations,
        validation: {
          validationReportId: `cbk-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: CBK_METADATA_VERSION,
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
    input: RunKnowledgeDiagnosticsInput,
    _config: CrossBusinessKnowledgeEngineConfiguration,
  ): KnowledgeRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const records = input.knowledgeRecordId
        ? [this.repository.get(input.knowledgeRecordId)].filter(Boolean)
        : this.repository.list();
      const errors: string[] = [];
      const warnings: string[] = [];

      if (records.length === 0) {
        errors.push(
          input.knowledgeRecordId
            ? "Knowledge record not found"
            : "No knowledge records collected",
        );
      }

      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        knowledgeRecords: records as ReturnType<EnterpriseKnowledgeRepository["list"]>,
        validation: {
          validationReportId: `cbk-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
          errors,
          warnings,
          durationMs: Date.now() - started,
          metadataVersion: CBK_METADATA_VERSION,
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
    this.repository.resetForTesting();
  }
}
