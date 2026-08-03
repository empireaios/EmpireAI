/** X1-04 — Business Model Generator Manager. */

import type { CompanyFactoryFrameworkEngine } from "../company-factory-framework/engine.js";
import type { BusinessOpportunityDiscovery } from "../business-opportunity-discovery/engine.js";
import type { MarketValidationEngine } from "../market-validation-engine/engine.js";
import {
  BMG_METADATA_VERSION,
  BUSINESS_MODEL_GENERATOR_ID,
} from "./paths.js";
import { appendBmgLog } from "./bmg-logging.js";
import { BusinessModelRecordStore } from "./business-model-record-store.js";
import { RevenueModelEngine } from "./revenue-model-engine.js";
import { ValuePropositionEngine } from "./value-proposition-engine.js";
import { CustomerSegmentEngine } from "./customer-segment-engine.js";
import { CostStructureEngine } from "./cost-structure-engine.js";
import { BusinessModelScoringEngine } from "./business-model-scoring-engine.js";
import { BusinessModelValidator } from "./business-model-validator.js";
import { BusinessModelMetadataGenerator } from "./business-model-metadata-generator.js";
import type { BusinessModelGeneratorConfiguration } from "./configuration.js";
import type {
  BusinessModelActionInput,
  BusinessModelEngineRecord,
  BusinessModelRecord,
  BusinessModelRunReport,
  ConnectBusinessModelGeneratorInput,
  GenerateBusinessModelInput,
} from "./types.js";

export type BusinessModelGeneratorDependencies = {
  companyFactoryFramework: CompanyFactoryFrameworkEngine | null;
  businessOpportunityDiscovery: BusinessOpportunityDiscovery | null;
  marketValidationEngine: MarketValidationEngine | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class BusinessModelGeneratorManager {
  private engineRecord: BusinessModelEngineRecord | null = null;
  private readonly store = new BusinessModelRecordStore();
  private readonly revenue = new RevenueModelEngine();
  private readonly valueProposition = new ValuePropositionEngine();
  private readonly customerSegment = new CustomerSegmentEngine();
  private readonly costStructure = new CostStructureEngine();
  private readonly scoring = new BusinessModelScoringEngine();
  private readonly validator = new BusinessModelValidator();
  private readonly metadataGenerator = new BusinessModelMetadataGenerator();

  constructor(private readonly deps: BusinessModelGeneratorDependencies) {}

  getEngineRecord(): BusinessModelEngineRecord | null {
    return this.engineRecord;
  }

  getBusinessModelRecords(): BusinessModelRecord[] {
    return this.store.list();
  }

  averageBusinessModelScore(): number {
    return this.store.averageScore();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): BusinessModelEngineRecord["dependencyPresence"] {
    return {
      companyFactoryFramework: this.deps.companyFactoryFramework
        ? this.probe(() => this.deps.companyFactoryFramework!.getState())
        : false,
      businessOpportunityDiscovery: this.deps.businessOpportunityDiscovery
        ? this.probe(() => this.deps.businessOpportunityDiscovery!.getState())
        : false,
      marketValidationEngine: this.deps.marketValidationEngine
        ? this.probe(() => this.deps.marketValidationEngine!.getState())
        : false,
    };
  }

  private requireConnected(): BusinessModelEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Business Model Generator not connected — call connectBusinessModelGenerator first",
      );
    }
    return this.engineRecord;
  }

  private structuralHealthScore(): number {
    const scores = [
      safe(() => {
        const score = this.deps.companyFactoryFramework?.getState()?.health?.healthScore;
        return typeof score === "number" ? score : 60;
      }, 60),
      safe(() => {
        const score = this.deps.businessOpportunityDiscovery?.getState()?.health?.healthScore;
        return typeof score === "number" ? score : 60;
      }, 60),
      safe(() => {
        const score = this.deps.marketValidationEngine?.getState()?.health?.healthScore;
        return typeof score === "number" ? score : 60;
      }, 60),
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  private resolveOpportunityReference(input: {
    opportunityReference?: string;
    industry?: string;
  }): { opportunityReference: string; industry: string } {
    const industry = input.industry?.trim() || "general-structural";

    if (input.opportunityReference?.trim()) {
      return {
        opportunityReference: input.opportunityReference.trim(),
        industry,
      };
    }

    const fromValidation = safe(() => {
      const records = this.deps.marketValidationEngine?.getValidationRecords() ?? [];
      if (records.length === 0) return null;
      const latest = records[records.length - 1]!;
      return {
        opportunityReference: latest.opportunityReference,
        industry: latest.industry || industry,
      };
    }, null);
    if (fromValidation) return fromValidation;

    const fromDiscovery = safe(() => {
      const records = this.deps.businessOpportunityDiscovery?.getOpportunityRecords() ?? [];
      if (records.length === 0) return null;
      const latest = records[records.length - 1]!;
      return {
        opportunityReference: latest.opportunityId,
        industry: latest.industry || industry,
      };
    }, null);
    if (fromDiscovery) return fromDiscovery;

    return {
      opportunityReference: `structural://opportunity/${industry}`,
      industry,
    };
  }

  registerWithFramework(
    config: BusinessModelGeneratorConfiguration,
  ): { frameworkModuleId: string | null; validation: BusinessModelRunReport["validation"] } {
    if (!this.deps.companyFactoryFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.companyFactoryFramework.registerCompanyModule({
      definition: {
        companyModuleIdentifier: BUSINESS_MODEL_GENERATOR_ID,
        moduleVersion: BMG_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X1-04",
        authenticationMethod: "none",
        credentialRef: "vault://business-model-generator",
        apiEndpointConfig: {
          baseUrl: "internal://business-model-generator",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "business_model.generated",
            "business_model.scored",
            "business_model.failed",
          ],
          maxEventsPerMinute: 60,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: true,
          requestsPerMinute: 60,
          burstLimit: 10,
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
      this.deps.companyFactoryFramework.activateCompanyModule(BUSINESS_MODEL_GENERATOR_ID);
    }

    appendBmgLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Business Model Generator with Company Factory Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `bmg-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: BMG_METADATA_VERSION,
      },
    };
  }

  connectBusinessModelGenerator(
    _input: ConnectBusinessModelGeneratorInput,
    config: BusinessModelGeneratorConfiguration,
  ): BusinessModelRunReport {
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

    appendBmgLog({
      event: "engine_connect",
      level: "info",
      details: `Business Model Generator connected · framework=${deps.companyFactoryFramework} · discovery=${deps.businessOpportunityDiscovery} · validation=${deps.marketValidationEngine}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      businessModelRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  generateBusinessModel(
    input: GenerateBusinessModelInput,
    config: BusinessModelGeneratorConfiguration,
  ): BusinessModelRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateGenerateInput(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "generate_business_model",
        engineRecord: engine,
        businessModelRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const resolved = this.resolveOpportunityReference(input);
    const health = this.structuralHealthScore();
    const revenueModel =
      input.revenueModel ?? this.revenue.selectRevenueModel(resolved.industry, health);

    let record = this.store.create({
      opportunityReference: resolved.opportunityReference,
      revenueModel,
      customerSegment: this.customerSegment.generate(resolved.industry),
      valueProposition: this.valueProposition.generate(resolved.industry),
      costStructure: this.costStructure.generate(resolved.industry),
      distributionChannels: this.valueProposition.generateDistributionChannels(resolved.industry),
      partnershipStrategy: this.valueProposition.generatePartnershipStrategy(resolved.industry),
      operationalModel: this.valueProposition.generateOperationalModel(resolved.industry),
      businessModelScore: config.minBusinessModelScore,
    });
    record = this.scoring.score(record, health, config.minBusinessModelScore);
    record.structuralSignalOnly = true;
    record.fabricatedValidationResults = false;
    this.store.persist(record);

    appendBmgLog({
      event: "business_model_generation",
      level: "info",
      details: `Generated structural business model · id=${record.businessModelId} · score=${record.businessModelScore}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "generate_business_model",
      engineRecord: engine,
      businessModelRecords: [record],
      validation: this.validator.validateBusinessModelRecord(record),
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(businessModelId?: string): BusinessModelRecord {
    if (businessModelId) {
      const found = this.store.get(businessModelId);
      if (!found) throw new Error(`Business model not found: ${businessModelId}`);
      return found;
    }
    const all = this.store.list();
    if (all.length === 0) throw new Error("No business model records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: BusinessModelActionInput,
    config: BusinessModelGeneratorConfiguration,
  ): BusinessModelRecord {
    try {
      return this.requireRecord(input.businessModelId);
    } catch {
      const created = this.generateBusinessModel(
        {
          opportunityReference: input.opportunityReference,
          industry: input.industry,
          validated: true,
        },
        config,
      );
      return created.businessModelRecords[0]!;
    }
  }

  private actionPass(
    action: BusinessModelRunReport["action"],
    transform: (record: BusinessModelRecord, industry: string) => BusinessModelRecord,
    input: BusinessModelActionInput,
    config: BusinessModelGeneratorConfiguration,
    event: string,
  ): BusinessModelRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const resolved = this.resolveOpportunityReference(input);
    let record = this.ensureRecord(input, config);
    record = transform(record, resolved.industry);
    record.structuralSignalOnly = true;
    record.fabricatedValidationResults = false;
    this.store.persist(record);

    appendBmgLog({
      event,
      level: "info",
      details: `${action} · id=${record.businessModelId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      businessModelRecords: [record],
      validation: this.validator.validateBusinessModelRecord(record),
      durationMs: Date.now() - started,
    });
  }

  generateRevenueModel(
    input: BusinessModelActionInput,
    config: BusinessModelGeneratorConfiguration,
  ): BusinessModelRunReport {
    if (!config.revenueModelRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "generate_revenue_model",
        engineRecord: engine,
        businessModelRecords: [],
        validation: {
          validationReportId: `bmg-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Revenue model rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: BMG_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }

    return this.actionPass(
      "generate_revenue_model",
      (r, industry) =>
        this.revenue.applyRevenueModel(
          r,
          this.revenue.selectRevenueModel(industry, this.structuralHealthScore()),
        ),
      input,
      config,
      "revenue_model_generation",
    );
  }

  generateCostStructure(
    input: BusinessModelActionInput,
    config: BusinessModelGeneratorConfiguration,
  ): BusinessModelRunReport {
    return this.actionPass(
      "generate_cost_structure",
      (r, industry) => this.costStructure.apply(r, this.costStructure.generate(industry)),
      input,
      config,
      "business_model_generation",
    );
  }

  generateValueProposition(
    input: BusinessModelActionInput,
    config: BusinessModelGeneratorConfiguration,
  ): BusinessModelRunReport {
    return this.actionPass(
      "generate_value_proposition",
      (r, industry) => this.valueProposition.apply(r, this.valueProposition.generate(industry)),
      input,
      config,
      "business_model_generation",
    );
  }

  generateCustomerSegments(
    input: BusinessModelActionInput,
    config: BusinessModelGeneratorConfiguration,
  ): BusinessModelRunReport {
    if (!config.customerSegmentRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "generate_customer_segments",
        engineRecord: engine,
        businessModelRecords: [],
        validation: {
          validationReportId: `bmg-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Customer segment rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: BMG_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }

    return this.actionPass(
      "generate_customer_segments",
      (r, industry) => this.customerSegment.apply(r, this.customerSegment.generate(industry)),
      input,
      config,
      "customer_segment_generation",
    );
  }

  generateDistributionChannels(
    input: BusinessModelActionInput,
    config: BusinessModelGeneratorConfiguration,
  ): BusinessModelRunReport {
    return this.actionPass(
      "generate_distribution_channels",
      (r, industry) =>
        this.valueProposition.applyDistributionChannels(
          r,
          this.valueProposition.generateDistributionChannels(industry),
        ),
      input,
      config,
      "business_model_generation",
    );
  }

  generatePartnershipStrategies(
    input: BusinessModelActionInput,
    config: BusinessModelGeneratorConfiguration,
  ): BusinessModelRunReport {
    return this.actionPass(
      "generate_partnership_strategies",
      (r, industry) =>
        this.valueProposition.applyPartnershipStrategy(
          r,
          this.valueProposition.generatePartnershipStrategy(industry),
        ),
      input,
      config,
      "business_model_generation",
    );
  }

  generateOperationalModels(
    input: BusinessModelActionInput,
    config: BusinessModelGeneratorConfiguration,
  ): BusinessModelRunReport {
    return this.actionPass(
      "generate_operational_models",
      (r, industry) =>
        this.valueProposition.applyOperationalModel(
          r,
          this.valueProposition.generateOperationalModel(industry),
        ),
      input,
      config,
      "business_model_generation",
    );
  }

  scoreBusinessModels(
    input: BusinessModelActionInput,
    config: BusinessModelGeneratorConfiguration,
  ): BusinessModelRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.businessScoringRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "score_business_models",
        engineRecord: engine,
        businessModelRecords: [],
        validation: {
          validationReportId: `bmg-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Business scoring rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: BMG_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }

    let record = this.ensureRecord(input, config);
    record = this.scoring.score(
      record,
      this.structuralHealthScore(),
      config.minBusinessModelScore,
    );
    this.store.persist(record);

    appendBmgLog({
      event: "business_model_scoring",
      level: "info",
      details: `Scored business model · id=${record.businessModelId} · score=${record.businessModelScore}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "score_business_models",
      engineRecord: engine,
      businessModelRecords: [record],
      validation: this.validator.validateBusinessModelRecord(record),
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.store.resetForTesting();
  }
}
