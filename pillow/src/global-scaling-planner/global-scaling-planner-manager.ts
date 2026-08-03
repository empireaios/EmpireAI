/** X3-14 — Global Scaling Planner Manager. */



import type { AutonomousScalingFrameworkEngine } from "../autonomous-scaling-framework/engine.js";

import type { WinningProductDetectorEngine } from "../winning-product-detector/engine.js";

import type { ScalingDecisionEngine } from "../scaling-decision-engine/engine.js";

import type { CapacityPlanningEngine } from "../capacity-planning-engine/engine.js";

import type { MarketingScaleEngine } from "../marketing-scale-engine/engine.js";

import type { SupplierScaleEngine } from "../supplier-scale-engine/engine.js";

import type { FinancialScaleEngine } from "../financial-scale-engine/engine.js";

import type { WorkforceIntelligenceEngine } from "../workforce-intelligence/engine.js";

import type { ExecutiveScalingDashboardEngine } from "../executive-scaling-dashboard/engine.js";

import type { BottleneckIntelligenceEngine } from "../bottleneck-intelligence/engine.js";

import type { OperationalElasticityEngine } from "../operational-elasticity-engine/engine.js";

import type { PerformancePreservationEngine } from "../performance-preservation-engine/engine.js";

import type { ScalingRiskMonitorEngine } from "../scaling-risk-monitor/engine.js";

import {

  GLOBAL_SCALING_PLANNER_ID,

  GSP_CAPABILITIES,

  GSP_METADATA_VERSION,

} from "./paths.js";

import type { GlobalScalingPlannerConfiguration } from "./configuration.js";

import { appendGspLog } from "./gsp-logging.js";

import { RegionalEvaluationEngine } from "./regional-evaluation-engine.js";

import { CountryAssessmentEngine } from "./country-assessment-engine.js";

import { GlobalReadinessEngine } from "./global-readiness-engine.js";

import { ExpansionPrioritizationEngine } from "./expansion-prioritization-engine.js";

import { GlobalRecommendationEngine } from "./global-recommendation-engine.js";

import { GlobalScalingMetadataGenerator } from "./global-scaling-metadata-generator.js";

import { GlobalScalingValidator } from "./global-scaling-validator.js";

import type {

  GlobalExpansionRecommendation,

  GlobalScalingPlannerRecord,

  GlobalScalingInput,

  GlobalScalingRecord,

  GlobalScalingValidationReport,

  GspRunReport,

  ConnectGlobalScalingPlannerInput,

  RunGspDiagnosticsInput,

} from "./types.js";



export type GlobalScalingPlannerDependencies = {

  autonomousScalingFramework?: AutonomousScalingFrameworkEngine | null;

  winningProductDetector?: WinningProductDetectorEngine | null;

  scalingDecisionEngine?: ScalingDecisionEngine | null;

  capacityPlanningEngine?: CapacityPlanningEngine | null;

  marketingScaleEngine?: MarketingScaleEngine | null;

  supplierScaleEngine?: SupplierScaleEngine | null;

  financialScaleEngine?: FinancialScaleEngine | null;

  workforceIntelligence?: WorkforceIntelligenceEngine | null;

  executiveScalingDashboard?: ExecutiveScalingDashboardEngine | null;

  bottleneckIntelligence?: BottleneckIntelligenceEngine | null;

  operationalElasticityEngine?: OperationalElasticityEngine | null;

  performancePreservationEngine?: PerformancePreservationEngine | null;

  scalingRiskMonitor?: ScalingRiskMonitorEngine | null;

};



export class GlobalScalingPlannerManager {

  private engineRecord: GlobalScalingPlannerRecord | null = null;

  private globalScalingRecords: GlobalScalingRecord[] = [];

  private recommendations: GlobalExpansionRecommendation[] = [];



  private readonly regionalEvaluationEngine = new RegionalEvaluationEngine();

  private readonly countryAssessmentEngine = new CountryAssessmentEngine();

  private readonly globalReadinessEngine = new GlobalReadinessEngine();

  private readonly prioritizationEngine = new ExpansionPrioritizationEngine();

  private readonly recommendationEngine = new GlobalRecommendationEngine();

  private readonly metadataGenerator = new GlobalScalingMetadataGenerator();

  private readonly validator = new GlobalScalingValidator();



  constructor(private readonly deps: GlobalScalingPlannerDependencies = {}) {}



  getEngineRecord(): GlobalScalingPlannerRecord | null {

    return this.engineRecord ? { ...this.engineRecord } : null;

  }



  getGlobalScalingRecords(): GlobalScalingRecord[] {

    return this.globalScalingRecords.map((r) => ({ ...r }));

  }



  getRecommendations(): GlobalExpansionRecommendation[] {

    return this.recommendations.map((r) => ({ ...r }));

  }



  highPriorityCount(): number {

    return this.globalScalingRecords.filter(

      (r) => r.expansionPriority === "critical" || r.expansionPriority === "high",

    ).length;

  }



  averageReadinessScore(): number {

    if (this.globalScalingRecords.length === 0) return 0;

    const sum = this.globalScalingRecords.reduce(

      (acc, r) => acc + r.expansionReadinessScore,

      0,

    );

    return Math.round(sum / this.globalScalingRecords.length);

  }



  resetForTesting(): void {

    this.engineRecord = null;

    this.globalScalingRecords = [];

    this.recommendations = [];

  }



  private dependencyPresence(): GlobalScalingPlannerRecord["dependencyPresence"] {

    return {

      autonomousScalingFramework: Boolean(this.deps.autonomousScalingFramework),

      winningProductDetector: Boolean(this.deps.winningProductDetector),

      scalingDecisionEngine: Boolean(this.deps.scalingDecisionEngine),

      capacityPlanningEngine: Boolean(this.deps.capacityPlanningEngine),

      marketingScaleEngine: Boolean(this.deps.marketingScaleEngine),

      supplierScaleEngine: Boolean(this.deps.supplierScaleEngine),

      financialScaleEngine: Boolean(this.deps.financialScaleEngine),

      workforceIntelligence: Boolean(this.deps.workforceIntelligence),

      executiveScalingDashboard: Boolean(this.deps.executiveScalingDashboard),

      bottleneckIntelligence: Boolean(this.deps.bottleneckIntelligence),

      operationalElasticityEngine: Boolean(this.deps.operationalElasticityEngine),

      performancePreservationEngine: Boolean(this.deps.performancePreservationEngine),

      scalingRiskMonitor: Boolean(this.deps.scalingRiskMonitor),

    };

  }



  private sourceAvailableFor(

    kind:

      | "international_expansion_readiness"

      | "target_region_identification"

      | "target_country_identification"

      | "regional_demand_evaluation"

      | "regional_operational_readiness"

      | "supplier_readiness_by_region"

      | "financial_readiness_for_expansion",

  ): boolean {

    const p = this.dependencyPresence();

    switch (kind) {

      case "international_expansion_readiness":

        return (

          p.scalingDecisionEngine ||

          p.executiveScalingDashboard ||

          p.scalingRiskMonitor ||

          p.autonomousScalingFramework

        );

      case "target_region_identification":

      case "target_country_identification":

        return (

          p.winningProductDetector ||

          p.marketingScaleEngine ||

          p.executiveScalingDashboard ||

          p.autonomousScalingFramework

        );

      case "regional_demand_evaluation":

        return (

          p.winningProductDetector ||

          p.marketingScaleEngine ||

          p.autonomousScalingFramework

        );

      case "regional_operational_readiness":

        return (

          p.capacityPlanningEngine ||

          p.operationalElasticityEngine ||

          p.bottleneckIntelligence ||

          p.autonomousScalingFramework

        );

      case "supplier_readiness_by_region":

        return p.supplierScaleEngine || p.autonomousScalingFramework;

      case "financial_readiness_for_expansion":

        return p.financialScaleEngine || p.autonomousScalingFramework;

      default:

        return true;

    }

  }



  private requireConnected(): GlobalScalingPlannerRecord {

    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {

      throw new Error(

        "Global Scaling Planner not connected — call connectGlobalScalingPlanner first",

      );

    }

    return this.engineRecord;

  }



  private storeRecord(record: GlobalScalingRecord): void {

    const idx = this.globalScalingRecords.findIndex(

      (r) =>

        r.companyReference === record.companyReference &&

        r.targetRegion === record.targetRegion &&

        r.targetCountry === record.targetCountry,

    );

    if (idx >= 0) this.globalScalingRecords[idx] = record;

    else this.globalScalingRecords.push(record);

  }



  failReport(

    action: GspRunReport["action"],

    errors: string[],

    durationMs: number,

  ): GspRunReport {

    const engineRecord =

      this.engineRecord ??

      ({

        engineRecordId: "gsp-eng-pending",

        timestamp: new Date().toISOString(),

        engineId: GLOBAL_SCALING_PLANNER_ID,

        engineVersion: "PILLOW-GSP-001",

        currentOperationalState: "failed",

        healthStatus: "failed",

        validationStatus: "failed",

        supportedCapabilities: [...GSP_CAPABILITIES],

        frameworkModuleId: null,

        dependencyPresence: this.dependencyPresence(),

        metadataVersion: GSP_METADATA_VERSION,

      } satisfies GlobalScalingPlannerRecord);



    return this.metadataGenerator.buildRunReport({

      action,

      engineRecord,

      validation: {

        validationReportId: `gsp-val-${Date.now()}`,

        validationTimestamp: new Date().toISOString(),

        decision: "fail",

        errors,

        warnings: [],

        durationMs,

        metadataVersion: GSP_METADATA_VERSION,

      },

      durationMs,

    });

  }



  registerWithFramework(config: GlobalScalingPlannerConfiguration): {

    frameworkModuleId: string | null;

    validation: GlobalScalingValidationReport;

  } {

    if (!this.deps.autonomousScalingFramework) {

      return {

        frameworkModuleId: null,

        validation: this.validator.validateConfiguration(config),

      };

    }



    const report = this.deps.autonomousScalingFramework.registerScalingModule({

      definition: {

        scalingModuleIdentifier: GLOBAL_SCALING_PLANNER_ID,

        moduleVersion: GSP_METADATA_VERSION,

        moduleType: "integration",

        integrationMissionId: "X3-14",

        eventRoutingConfig: {

          enabled: true,

          topics: [

            "global_scaling.readiness",

            "global_scaling.region",

            "global_scaling.country",

            "global_scaling.ranked",

            "global_scaling.recommendation",

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

          "scaling_module_registration",

          "scaling_lifecycle_management",

          "scaling_event_routing",

          "scaling_data_abstraction",

          "scaling_validation",

          "diagnostics",

        ],

      },

      forceRegister: true,

    });



    if (report.validation.decision !== "fail") {

      this.deps.autonomousScalingFramework.activateScalingModule(GLOBAL_SCALING_PLANNER_ID);

    }



    appendGspLog({

      event: "framework_registration",

      level: "info",

      details: `Registered Global Scaling Planner with ASF: ${report.validation.decision}`,

    });



    return {

      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,

      validation: {

        validationReportId: `gsp-val-${Date.now()}`,

        validationTimestamp: new Date().toISOString(),

        decision: report.validation.decision,

        errors: report.validation.errors,

        warnings: report.validation.warnings,

        durationMs: report.durationMs,

        metadataVersion: GSP_METADATA_VERSION,

      },

    };

  }



  connectGlobalScalingPlanner(

    _input: ConnectGlobalScalingPlannerInput,

    config: GlobalScalingPlannerConfiguration,

  ): GspRunReport {

    const started = Date.now();

    const configValidation = this.validator.validateConfiguration(config);

    if (configValidation.decision === "fail") {

      return this.failReport("connect", configValidation.errors, Date.now() - started);

    }



    const framework = this.registerWithFramework(config);

    const presence = this.dependencyPresence();

    const corePresent = presence.autonomousScalingFramework;

    const connectedCount = Object.values(presence).filter(Boolean).length;



    this.engineRecord = {

      engineRecordId: `gsp-eng-${Date.now()}`,

      timestamp: new Date().toISOString(),

      engineId: GLOBAL_SCALING_PLANNER_ID,

      engineVersion: "PILLOW-GSP-001",

      currentOperationalState: "connected",

      healthStatus: corePresent

        ? connectedCount >= 13

          ? "healthy"

          : "degraded"

        : "degraded",

      validationStatus:

        framework.validation.decision === "fail"

          ? "failed"

          : framework.validation.decision === "partial"

            ? "partial"

            : "passed",

      supportedCapabilities: [...GSP_CAPABILITIES],

      frameworkModuleId: framework.frameworkModuleId,

      dependencyPresence: presence,

      metadataVersion: GSP_METADATA_VERSION,

    };



    appendGspLog({

      event: "engine_connected",

      level: "info",

      details:

        "Global Scaling Planner connected — never recommend international expansion without validated readiness; structural signals only",

    });



    const warnings = [

      ...framework.validation.warnings,

      ...configValidation.warnings,

      ...Object.entries(presence)

        .filter(([, ok]) => !ok)

        .map(([key]) => `${key} unavailable`),

      "Never recommend international expansion without validated readiness",

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



  private runPlanningOp(

    action: GspRunReport["action"],

    label: string,

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

    logEvent: string,

    produce: () => GlobalScalingRecord,

  ): GspRunReport {

    const started = Date.now();

    try {

      if (!config.planningRulesEnabled) {

        return this.failReport(action, ["Planning rules disabled"], Date.now() - started);

      }

      const engineRecord = this.requireConnected();

      const validation = this.validator.validateGlobalScaling(label, input, config);

      if (validation.decision === "fail") {

        return this.failReport(action, validation.errors, Date.now() - started);

      }



      const record = produce();

      this.storeRecord(record);

      engineRecord.currentOperationalState = "active";

      engineRecord.timestamp = new Date().toISOString();



      appendGspLog({

        event: logEvent,

        level: "info",

        details: `${label} · ${record.targetRegion}/${record.targetCountry} · readiness=${record.expansionReadinessScore} · priority=${record.expansionPriority}`,

      });



      return this.metadataGenerator.buildRunReport({

        action,

        engineRecord,

        globalScalingRecords: [record],

        validation,

        durationMs: Date.now() - started,

      });

    } catch (error) {

      const message = error instanceof Error ? error.message : String(error);

      appendGspLog({ event: "global_scaling_failure", level: "error", details: message });

      return this.failReport(action, [message], Date.now() - started);

    }

  }



  evaluateInternationalExpansionReadiness(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

  ): GspRunReport {

    return this.runPlanningOp(

      "evaluate_international_expansion_readiness",

      "International expansion readiness",

      input,

      config,

      "global_scaling_evaluation",

      () =>

        this.globalReadinessEngine.evaluateInternationalExpansionReadiness(

          input,

          config,

          this.sourceAvailableFor("international_expansion_readiness"),

        ),

    );

  }



  identifyTargetRegions(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

  ): GspRunReport {

    return this.runPlanningOp(

      "identify_target_regions",

      "Target region identification",

      input,

      config,

      "global_scaling_evaluation",

      () =>

        this.countryAssessmentEngine.identifyTargetRegions(

          input,

          config,

          this.sourceAvailableFor("target_region_identification"),

        ),

    );

  }



  identifyTargetCountries(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

  ): GspRunReport {

    return this.runPlanningOp(

      "identify_target_countries",

      "Target country identification",

      input,

      config,

      "global_scaling_evaluation",

      () =>

        this.countryAssessmentEngine.identifyTargetCountries(

          input,

          config,

          this.sourceAvailableFor("target_country_identification"),

        ),

    );

  }



  evaluateRegionalDemand(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

  ): GspRunReport {

    return this.runPlanningOp(

      "evaluate_regional_demand",

      "Regional demand evaluation",

      input,

      config,

      "global_scaling_evaluation",

      () =>

        this.regionalEvaluationEngine.evaluateDemand(

          input,

          config,

          this.sourceAvailableFor("regional_demand_evaluation"),

        ),

    );

  }



  evaluateRegionalOperationalReadiness(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

  ): GspRunReport {

    return this.runPlanningOp(

      "evaluate_regional_operational_readiness",

      "Regional operational readiness",

      input,

      config,

      "global_scaling_evaluation",

      () =>

        this.regionalEvaluationEngine.evaluateOperationalReadiness(

          input,

          config,

          this.sourceAvailableFor("regional_operational_readiness"),

        ),

    );

  }



  evaluateSupplierReadinessByRegion(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

  ): GspRunReport {

    return this.runPlanningOp(

      "evaluate_supplier_readiness_by_region",

      "Supplier readiness by region",

      input,

      config,

      "global_scaling_evaluation",

      () =>

        this.globalReadinessEngine.evaluateSupplierReadinessByRegion(

          input,

          config,

          this.sourceAvailableFor("supplier_readiness_by_region"),

        ),

    );

  }



  evaluateFinancialReadinessForExpansion(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

  ): GspRunReport {

    return this.runPlanningOp(

      "evaluate_financial_readiness_for_expansion",

      "Financial readiness for expansion",

      input,

      config,

      "global_scaling_evaluation",

      () =>

        this.globalReadinessEngine.evaluateFinancialReadinessForExpansion(

          input,

          config,

          this.sourceAvailableFor("financial_readiness_for_expansion"),

        ),

    );

  }



  rankInternationalScalingOpportunities(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

  ): GspRunReport {

    const started = Date.now();

    try {

      const engineRecord = this.requireConnected();

      const validation = this.validator.validateGlobalScaling(

        "International scaling opportunity ranking",

        input,

        config,

      );

      if (validation.decision === "fail") {

        return this.failReport(

          "rank_international_scaling_opportunities",

          validation.errors,

          Date.now() - started,

        );

      }

      const ranked = this.prioritizationEngine.rank(this.globalScalingRecords, config);

      this.globalScalingRecords = ranked;

      engineRecord.currentOperationalState = "active";

      appendGspLog({

        event: "global_scaling_ranking",

        level: "info",

        details: `Ranked ${ranked.length} international scaling opportunities — never recommend without validated readiness`,

      });

      return this.metadataGenerator.buildRunReport({

        action: "rank_international_scaling_opportunities",

        engineRecord,

        globalScalingRecords: ranked,

        validation,

        durationMs: Date.now() - started,

      });

    } catch (error) {

      const message = error instanceof Error ? error.message : String(error);

      appendGspLog({ event: "global_scaling_failure", level: "error", details: message });

      return this.failReport(

        "rank_international_scaling_opportunities",

        [message],

        Date.now() - started,

      );

    }

  }



  recommendGlobalExpansion(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

  ): GspRunReport {

    const started = Date.now();

    try {

      if (!config.recommendationRulesEnabled) {

        return this.failReport(

          "recommend_global_expansion",

          ["Recommendation rules disabled"],

          0,

        );

      }

      const engineRecord = this.requireConnected();

      const validation = this.validator.validateGlobalScaling(

        "Global expansion recommendation",

        input,

        config,

      );

      if (validation.decision === "fail") {

        return this.failReport(

          "recommend_global_expansion",

          validation.errors,

          Date.now() - started,

        );

      }

      this.recommendations = this.recommendationEngine.generate(

        this.globalScalingRecords,

        config,

      );

      engineRecord.currentOperationalState = "active";

      appendGspLog({

        event: "global_scaling_recommendations",

        level: "info",

        details: `Generated ${this.recommendations.length} global expansion recommendations`,

      });

      return this.metadataGenerator.buildRunReport({

        action: "recommend_global_expansion",

        engineRecord,

        globalScalingRecords: this.globalScalingRecords,

        recommendations: this.recommendations,

        validation,

        durationMs: Date.now() - started,

      });

    } catch (error) {

      const message = error instanceof Error ? error.message : String(error);

      appendGspLog({ event: "global_scaling_failure", level: "error", details: message });

      return this.failReport("recommend_global_expansion", [message], Date.now() - started);

    }

  }



  runDiagnostics(

    _input: RunGspDiagnosticsInput,

    config: GlobalScalingPlannerConfiguration,

  ): GspRunReport {

    const started = Date.now();

    const configValidation = this.validator.validateConfiguration(config);

    const engineRecord =

      this.engineRecord ??

      ({

        engineRecordId: `gsp-eng-diag-${Date.now()}`,

        timestamp: new Date().toISOString(),

        engineId: GLOBAL_SCALING_PLANNER_ID,

        engineVersion: "PILLOW-GSP-001",

        currentOperationalState: "connected",

        healthStatus: "healthy",

        validationStatus: "passed",

        supportedCapabilities: [...GSP_CAPABILITIES],

        frameworkModuleId: null,

        dependencyPresence: this.dependencyPresence(),

        metadataVersion: GSP_METADATA_VERSION,

      } satisfies GlobalScalingPlannerRecord);



    appendGspLog({

      event: "diagnostics",

      level: "info",

      details: `Diagnostics · records=${this.globalScalingRecords.length} · highPriority=${this.highPriorityCount()} · avgReadiness=${this.averageReadinessScore()}%`,

    });



    return this.metadataGenerator.buildRunReport({

      action: "diagnostics",

      engineRecord,

      globalScalingRecords: this.globalScalingRecords,

      recommendations: this.recommendations,

      validation: configValidation,

      durationMs: Date.now() - started,

    });

  }

}


