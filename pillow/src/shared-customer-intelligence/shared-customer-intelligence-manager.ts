/** X2-12 — Shared Customer Intelligence Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { MultiCompanyRegistry } from "../multi-company-registry/engine.js";
import type { CrossBusinessKnowledgeEngine } from "../cross-business-knowledge-engine/engine.js";
import type { CrossCompanyResourceEngine } from "../cross-company-resource-engine/engine.js";
import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CustomerOperationsCertificationEngine } from "../customer-operations-certification/engine.js";
import {
  SCI_CAPABILITIES,
  SCI_METADATA_VERSION,
  SHARED_CUSTOMER_INTELLIGENCE_ID,
} from "./paths.js";
import { appendSciLog } from "./sci-logging.js";
import { CustomerKnowledgeEngine } from "./customer-knowledge-engine.js";
import { CustomerIdentityResolutionEngine } from "./customer-identity-resolution-engine.js";
import { CustomerBehaviourEngine } from "./customer-behaviour-engine.js";
import { CustomerInsightEngine } from "./customer-insight-engine.js";
import { CustomerRecommendationEngine } from "./customer-recommendation-engine.js";
import { CustomerIntelligenceValidator } from "./customer-intelligence-validator.js";
import { CustomerIntelligenceMetadataGenerator } from "./customer-intelligence-metadata-generator.js";
import type { SharedCustomerIntelligenceConfiguration } from "./configuration.js";
import type {
  AnalyzeCustomerBehaviourInput,
  ConnectSharedCustomerIntelligenceInput,
  ConsolidateCustomerKnowledgeInput,
  CustomerIntelligenceEngineRecord,
  CustomerIntelligenceRunReport,
  CustomerRiskSignal,
  DetectCrossSellInput,
  DetectCustomerRisksInput,
  GenerateCustomerInsightsInput,
  RecommendCustomerIntelligenceInput,
  ResolveCustomerIdentityInput,
  RunCustomerIntelligenceDiagnosticsInput,
} from "./types.js";

export type SharedCustomerIntelligenceDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  multiCompanyRegistry: MultiCompanyRegistry | null;
  crossBusinessKnowledgeEngine: CrossBusinessKnowledgeEngine | null;
  crossCompanyResourceEngine: CrossCompanyResourceEngine | null;
  customerIdentityEngine: CustomerIdentityEngine | null;
  customerOperationsCertification: CustomerOperationsCertificationEngine | null;
};

export class SharedCustomerIntelligenceManager {
  private engineRecord: CustomerIntelligenceEngineRecord | null = null;
  private latestRisks: CustomerRiskSignal[] = [];
  private readonly knowledge = new CustomerKnowledgeEngine();
  private readonly identityResolution = new CustomerIdentityResolutionEngine(this.knowledge);
  private readonly behaviourEngine = new CustomerBehaviourEngine(this.knowledge);
  private readonly insightEngine = new CustomerInsightEngine(this.knowledge);
  private readonly recommendations = new CustomerRecommendationEngine();
  private readonly validator = new CustomerIntelligenceValidator();
  private readonly metadataGenerator = new CustomerIntelligenceMetadataGenerator();

  constructor(private readonly deps: SharedCustomerIntelligenceDependencies) {}

  getEngineRecord(): CustomerIntelligenceEngineRecord | null {
    return this.engineRecord;
  }

  getIntelligenceRecords() {
    return this.knowledge.list();
  }

  crossCompanyCount(): number {
    return this.knowledge.list().filter((r) => r.crossCompanyRelationship).length;
  }

  highRiskCount(): number {
    return this.latestRisks.filter((r) => r.severity === "high").length;
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.latestRisks = [];
    this.knowledge.resetForTesting();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): CustomerIntelligenceEngineRecord["dependencyPresence"] {
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
      customerIdentityEngine: this.deps.customerIdentityEngine
        ? this.probe(() => this.deps.customerIdentityEngine!.getState())
        : false,
      customerOperationsCertification: this.deps.customerOperationsCertification
        ? this.probe(() => this.deps.customerOperationsCertification!.getState())
        : false,
    };
  }

  private requireConnected(): CustomerIntelligenceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Shared Customer Intelligence not connected — call connectSharedCustomerIntelligence first",
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
    action: CustomerIntelligenceRunReport["action"],
    errors: string[],
    durationMs: number,
  ): CustomerIntelligenceRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "sci-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: SHARED_CUSTOMER_INTELLIGENCE_ID,
        engineVersion: "PILLOW-SCI-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...SCI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: SCI_METADATA_VERSION,
      } satisfies CustomerIntelligenceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `sci-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: SCI_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(
    config: SharedCustomerIntelligenceConfiguration,
  ): {
    frameworkModuleId: string | null;
    validation: CustomerIntelligenceRunReport["validation"];
  } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: SHARED_CUSTOMER_INTELLIGENCE_ID,
        moduleVersion: SCI_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-12",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "customer.synchronized",
            "customer.resolved",
            "customer.insight",
            "customer.risk",
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
        SHARED_CUSTOMER_INTELLIGENCE_ID,
      );
    }

    appendSciLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Shared Customer Intelligence with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `sci-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: SCI_METADATA_VERSION,
      },
    };
  }

  connectSharedCustomerIntelligence(
    _input: ConnectSharedCustomerIntelligenceInput,
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceRunReport {
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
      engineRecordId: `sci-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SHARED_CUSTOMER_INTELLIGENCE_ID,
      engineVersion: "PILLOW-SCI-001",
      currentOperationalState: "connected",
      healthStatus: corePresent ? (connectedCount >= 5 ? "healthy" : "degraded") : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...SCI_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: SCI_METADATA_VERSION,
    };

    appendSciLog({
      event: "engine_connected",
      level: "info",
      details: "Shared Customer Intelligence connected",
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

  consolidateCustomerKnowledge(
    input: ConsolidateCustomerKnowledgeInput,
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateConsolidate(input, config);
      if (validation.decision === "fail") {
        return this.failReport("consolidate_knowledge", validation.errors, Date.now() - started);
      }

      const companies =
        input.companyReferences?.length ? input.companyReferences : this.defaultCompanies().slice(0, 1);
      const record = this.knowledge.upsert({
        customerReference: input.customerReference,
        associatedCompanies: companies,
        customerProfileSummary:
          input.profileSummary ?? `Structural profile for ${input.customerReference}`,
        behaviourSummary: "Behaviour pending analysis",
        lifetimeValueEstimate: input.lifetimeValueHint ?? 50,
        recommendedOpportunities: [],
        preferenceSignals: input.preferenceSignals ?? [],
        riskLevel: "low",
        crossCompanyRelationship: companies.length > 1,
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

  resolveCustomerIdentity(
    input: ResolveCustomerIdentityInput,
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateResolve(input, config);
      if (validation.decision === "fail") {
        return this.failReport("resolve_identity", validation.errors, Date.now() - started);
      }
      const record = this.identityResolution.resolve(input);
      engineRecord.currentOperationalState = "active";
      return this.metadataGenerator.buildRunReport({
        action: "resolve_identity",
        engineRecord,
        intelligenceRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "resolve_identity",
        [error instanceof Error ? error.message : "Identity resolution failure"],
        Date.now() - started,
      );
    }
  }

  analyzeCustomerBehaviour(
    input: AnalyzeCustomerBehaviourInput,
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateBehaviour(input, config);
      if (validation.decision === "fail") {
        return this.failReport("analyze_behaviour", validation.errors, Date.now() - started);
      }
      if (!this.knowledge.get(input.customerReference)) {
        this.knowledge.upsert({
          customerReference: input.customerReference,
          associatedCompanies: this.defaultCompanies().slice(0, 1),
          customerProfileSummary: `Structural profile for ${input.customerReference}`,
          behaviourSummary: "Behaviour pending analysis",
          lifetimeValueEstimate: 50,
          recommendedOpportunities: [],
          preferenceSignals: [],
          riskLevel: "low",
          crossCompanyRelationship: false,
        });
      }
      const record = this.behaviourEngine.analyze(input);
      return this.metadataGenerator.buildRunReport({
        action: "analyze_behaviour",
        engineRecord,
        intelligenceRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "analyze_behaviour",
        [error instanceof Error ? error.message : "Behaviour analysis failure"],
        Date.now() - started,
      );
    }
  }

  generateInsights(
    input: GenerateCustomerInsightsInput,
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const source = input.customerReference
        ? this.knowledge.get(input.customerReference)
          ? [this.knowledge.get(input.customerReference)!]
          : []
        : this.knowledge.list();
      const updated = this.insightEngine.generateInsights(source, config);
      appendSciLog({
        event: "insight_generation",
        level: "info",
        details: `Insights generated for ${updated.length} customers`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "generate_insights",
        engineRecord,
        intelligenceRecords: updated,
        validation: {
          validationReportId: `sci-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: config.insightGenerationRulesEnabled ? "pass" : "partial",
          errors: [],
          warnings: config.insightGenerationRulesEnabled
            ? []
            : ["Insight generation rules disabled"],
          durationMs: Date.now() - started,
          metadataVersion: SCI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "generate_insights",
        [error instanceof Error ? error.message : "Insight generation failure"],
        Date.now() - started,
      );
    }
  }

  detectCrossSell(
    input: DetectCrossSellInput,
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const source = input.customerReference
        ? this.knowledge.get(input.customerReference)
          ? [this.knowledge.get(input.customerReference)!]
          : []
        : this.knowledge.list();
      const matched = this.insightEngine.detectCrossSell(source, config);
      return this.metadataGenerator.buildRunReport({
        action: "detect_cross_sell",
        engineRecord,
        intelligenceRecords: matched,
        validation: {
          validationReportId: `sci-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: matched.length === 0 ? ["No cross-sell opportunities detected"] : [],
          durationMs: Date.now() - started,
          metadataVersion: SCI_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "detect_cross_sell",
        [error instanceof Error ? error.message : "Cross-sell detection failure"],
        Date.now() - started,
      );
    }
  }

  detectCustomerRisks(
    input: DetectCustomerRisksInput,
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const source = input.customerReference
        ? this.knowledge.get(input.customerReference)
          ? [this.knowledge.get(input.customerReference)!]
          : []
        : this.knowledge.list();
      this.latestRisks = this.insightEngine.detectRisks(source, config);
      return this.metadataGenerator.buildRunReport({
        action: "detect_risks",
        engineRecord,
        intelligenceRecords: this.knowledge.list(),
        riskSignals: this.latestRisks,
        validation: {
          validationReportId: `sci-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: this.latestRisks.some((r) => r.severity === "high") ? "partial" : "pass",
          errors: [],
          warnings: this.latestRisks.map((r) => r.rationale),
          durationMs: Date.now() - started,
          metadataVersion: SCI_METADATA_VERSION,
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

  generateRecommendations(
    input: RecommendCustomerIntelligenceInput,
    _config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const recs = this.recommendations.recommend({
        records: this.knowledge.list(),
        risks: this.latestRisks,
        customerReference: input.customerReference,
        companyReference: input.companyReference,
      });
      appendSciLog({
        event: "recommendation_generation",
        level: "info",
        details: `Recommendations generated: ${recs.length}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "recommend",
        engineRecord,
        intelligenceRecords: this.knowledge.list(),
        riskSignals: this.latestRisks,
        recommendations: recs,
        validation: {
          validationReportId: `sci-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: SCI_METADATA_VERSION,
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
    input: RunCustomerIntelligenceDiagnosticsInput,
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const records = input.customerReference
        ? this.knowledge.get(input.customerReference)
          ? [this.knowledge.get(input.customerReference)!]
          : []
        : this.knowledge.list();
      this.latestRisks = this.insightEngine.detectRisks(records, config);
      const recs = this.recommendations.recommend({
        records,
        risks: this.latestRisks,
        customerReference: input.customerReference,
      });
      appendSciLog({
        event: "diagnostics",
        level: "info",
        details: `Diagnostics records=${records.length} risks=${this.latestRisks.length}`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        intelligenceRecords: records,
        riskSignals: this.latestRisks,
        recommendations: recs,
        validation: {
          validationReportId: `sci-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: SCI_METADATA_VERSION,
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
