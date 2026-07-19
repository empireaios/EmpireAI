/** R4-17 — Customer Journey Intelligence Manager. */

import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { CustomerSentimentEngine } from "../customer-sentiment-engine/engine.js";
import type { CustomerLifetimeValueEngine } from "../customer-lifetime-value-engine/engine.js";
import type { CustomerSegmentationEngine } from "../customer-segmentation-engine/engine.js";
import { appendCjiLog } from "./cji-logging.js";
import { JourneyRegistry } from "./journey-registry.js";
import { JourneyMetadataGenerator } from "./journey-metadata-generator.js";
import { JourneyMappingEngine } from "./journey-mapping-engine.js";
import { JourneyAnalyticsEngine } from "./journey-analytics-engine.js";
import { JourneyOptimizationEngine } from "./journey-optimization-engine.js";
import { JourneyPredictionEngine } from "./journey-prediction-engine.js";
import { JourneyRecommendationEngine } from "./journey-recommendation-engine.js";
import { JourneyValidator, JourneyValidationEngine } from "./journey-validator.js";
import type { CustomerJourneyIntelligenceConfiguration } from "./configuration.js";
import type {
  ConnectJourneyIntelligenceInput,
  CustomerJourneySignals,
  DetectDropOffPointsInput,
  DetectFrictionPointsInput,
  DetectJourneyFailuresInput,
  IdentifyJourneyStagesInput,
  JourneyAnalysis,
  JourneyFailure,
  JourneyInsight,
  JourneyIntelligenceEngineRecord,
  JourneyRecord,
  JourneyRunReport,
  MapCustomerJourneyInput,
  MeasureConversionRatesInput,
  MeasureJourneyPerformanceInput,
  PredictCustomerProgressionInput,
  RecommendJourneyImprovementsInput,
  TrackCustomerTouchpointsInput,
} from "./types.js";

export class CustomerJourneyIntelligenceManager {
  private engineRecord: JourneyIntelligenceEngineRecord | null = null;
  private readonly registry = new JourneyRegistry();
  private readonly metadataGenerator = new JourneyMetadataGenerator();
  private readonly mappingEngine = new JourneyMappingEngine();
  private readonly analyticsEngine = new JourneyAnalyticsEngine();
  private readonly optimizationEngine = new JourneyOptimizationEngine();
  private readonly predictionEngine = new JourneyPredictionEngine();
  private readonly recommendationEngine = new JourneyRecommendationEngine();
  private readonly validationEngine = new JourneyValidationEngine();
  private readonly validator = new JourneyValidator();

  constructor(
    private readonly identityEngine: CustomerIdentityEngine | null,
    private readonly crmFoundation: CrmFoundationEngine | null,
    private readonly timelineEngine: CustomerTimelineEngine | null,
    private readonly sentimentEngine: CustomerSentimentEngine | null,
    private readonly customerLifetimeValueEngine: CustomerLifetimeValueEngine | null,
    private readonly customerSegmentationEngine: CustomerSegmentationEngine | null,
  ) {}

  getEngineRecord(): JourneyIntelligenceEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): JourneyRegistry {
    return this.registry;
  }

  getJourneyRecords(): JourneyRecord[] {
    return this.registry.listRecords();
  }

  getMetadataGenerator(): JourneyMetadataGenerator {
    return this.metadataGenerator;
  }

  private isEngineConnected(
    engine: { getEngineRecord?: () => { currentOperationalState?: string } | null } | null,
  ): boolean {
    try {
      const record = engine?.getEngineRecord?.();
      return (
        record?.currentOperationalState === "active" ||
        record?.currentOperationalState === "connected"
      );
    } catch {
      return false;
    }
  }

  private resolveCustomer(customerId: string): { valid: boolean; error: string | null } {
    if (!customerId?.trim()) return { valid: false, error: "Customer ID is required" };

    const hasIdentity =
      this.identityEngine?.getCustomerRecords().some((r) => r.customerId === customerId) ?? false;
    const hasCrm =
      this.crmFoundation?.getCrmRecords().some((p) => p.customerId === customerId) ?? false;
    const hasTimeline =
      this.timelineEngine?.getTimelineRecords().some((r) => r.customerId === customerId) ?? false;

    if (!hasIdentity && !hasCrm && !hasTimeline) {
      return { valid: false, error: `No customer records found for ${customerId}` };
    }
    return { valid: true, error: null };
  }

  gatherSignals(customerId: string): CustomerJourneySignals {
    const timelineEvents =
      this.timelineEngine?.getTimelineRecords().filter((r) => r.customerId === customerId) ?? [];

    const touchpointReferences = timelineEvents.map((e) => e.timelineRecordId);
    const purchaseCount = timelineEvents.filter((e) => e.eventType === "purchase").length;
    const supportCount = timelineEvents.filter((e) => e.eventType === "support").length;
    const communicationCount = timelineEvents.filter((e) => e.eventType === "communication").length;

    const lastEvent = timelineEvents.at(-1);
    const daysSinceLastEvent = lastEvent
      ? Math.floor(
          (Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24),
        )
      : 999;

    const sentimentRecords =
      this.sentimentEngine?.getSentimentRecords().filter((r) => r.customerId === customerId) ?? [];
    const avgSentimentScore =
      sentimentRecords.length > 0
        ? sentimentRecords.reduce((s, r) => s + r.sentimentScore, 0) / sentimentRecords.length
        : 50;
    const negativeSentimentCount = sentimentRecords.filter((r) => r.sentimentScore < 40).length;

    const clvRecords =
      this.customerLifetimeValueEngine?.getClvRecords().filter((r) => r.customerId === customerId) ??
      [];
    const lifetimeValue = clvRecords.at(-1)?.lifetimeValue ?? 0;

    const segmentationRecords =
      this.customerSegmentationEngine
        ?.getSegmentationRecords()
        .filter((r) => r.customerId === customerId) ?? [];
    const assignedSegments = segmentationRecords.at(-1)?.assignedSegments ?? [];

    return {
      touchpointReferences,
      purchaseCount,
      supportCount,
      communicationCount,
      timelineEventCount: timelineEvents.length,
      avgSentimentScore,
      negativeSentimentCount,
      lifetimeValue,
      assignedSegments,
      daysSinceLastEvent,
    };
  }

  private analyzeJourney(
    customerId: string,
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyAnalysis {
    const signals = this.gatherSignals(customerId);
    const journeyStage = this.mappingEngine.mapStage(signals, config);
    const performance = this.analyticsEngine.measurePerformance(signals, journeyStage);
    const conversion = this.analyticsEngine.measureConversion(
      signals,
      config.conversionPurchaseThreshold,
    );
    const dropOff = this.analyticsEngine.detectDropOff(signals, config.dropOffInactivityDays);
    const friction = this.analyticsEngine.detectFriction(
      signals,
      config.frictionSentimentThreshold,
    );
    const recommendedActions = this.optimizationEngine.recommend(friction, dropOff, config);

    return {
      journeyStage,
      conversionStatus: conversion.conversionStatus,
      frictionIndicators: [...friction, ...dropOff],
      journeyScore: performance.journeyScore,
      recommendedActions,
    };
  }

  private buildJourneyRecord(
    customerId: string,
    config: CustomerJourneyIntelligenceConfiguration,
  ): {
    record: JourneyRecord | null;
    insights: JourneyInsight[];
    validation: JourneyRunReport["validation"];
    error: string | null;
  } {
    const signals = this.gatherSignals(customerId);
    const analysis = this.analyzeJourney(customerId, config);

    let record = this.metadataGenerator.buildJourneyRecord({
      customerId,
      journeyStage: analysis.journeyStage,
      touchpointReferences: this.mappingEngine.mapTouchpoints(signals),
      conversionStatus: analysis.conversionStatus,
      frictionIndicators: analysis.frictionIndicators,
      journeyScore: analysis.journeyScore,
      recommendedActions: analysis.recommendedActions,
      validationStatus: "pending",
    });

    const validation = this.validationEngine.validateJourneyRecord(record, config);
    if (validation.decision === "fail") {
      return { record: null, insights: [], validation, error: validation.errors.join("; ") };
    }

    record = {
      ...record,
      validationStatus: validation.decision === "pass" ? "passed" : "partial",
    };

    this.registry.storeRecord(record);

    const insights: JourneyInsight[] = [];
    if (analysis.frictionIndicators.some((f) => f.includes("dropoff") || f.includes("abandonment"))) {
      const insight = this.metadataGenerator.buildInsight({
        customerId,
        journeyRecordId: record.journeyRecordId,
        insightType: "dropoff",
        message: "Drop-off indicators detected in customer journey",
      });
      this.registry.storeInsight(insight);
      insights.push(insight);
    }
    if (analysis.frictionIndicators.some((f) => f.includes("friction"))) {
      const insight = this.metadataGenerator.buildInsight({
        customerId,
        journeyRecordId: record.journeyRecordId,
        insightType: "friction",
        message: "Friction points detected in customer journey",
      });
      this.registry.storeInsight(insight);
      insights.push(insight);
    }

    return { record, insights, validation, error: null };
  }

  connectJourneyIntelligenceEngine(
    _input: ConnectJourneyIntelligenceInput,
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState: configValidation.decision === "fail" ? "failed" : "active",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      identityEngineConnected: this.isEngineConnected(this.identityEngine),
      crmFoundationConnected: this.isEngineConnected(this.crmFoundation),
      timelineEngineConnected: this.isEngineConnected(this.timelineEngine),
      sentimentEngineConnected: this.isEngineConnected(this.sentimentEngine),
      customerLifetimeValueEngineConnected: this.isEngineConnected(this.customerLifetimeValueEngine),
      customerSegmentationEngineConnected: this.isEngineConnected(this.customerSegmentationEngine),
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (configValidation.decision !== "pass") {
      validation.warnings.push(...configValidation.warnings);
      if (configValidation.errors.length > 0) {
        validation.errors.push(...configValidation.errors);
        validation.decision = "fail";
      } else {
        validation.decision = "partial";
      }
    }

    appendCjiLog({
      event: "engine_initialization",
      level: "info",
      details: `Journey Intelligence Engine connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      journeyRecords: [],
      insights: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  mapCustomerJourney(
    input: MapCustomerJourneyInput,
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyRunReport {
    return this.runAction("map_journey", config, () => this.processCustomer(input.customerId, config));
  }

  trackCustomerTouchpoints(
    input: TrackCustomerTouchpointsInput,
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyRunReport {
    return this.runAction("track_touchpoints", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) return this.emptyResult(customer.error);

      const signals = this.gatherSignals(input.customerId);
      const built = this.buildJourneyRecord(input.customerId, config);
      if (!built.record) return this.emptyResult(built.error, built.validation);

      appendCjiLog({
        event: "journey_mapping",
        level: "info",
        details: `Tracked ${signals.touchpointReferences.length} touchpoint(s) for ${input.customerId}`,
      });

      return {
        journeyRecords: [built.record],
        insights: built.insights,
        failures: [],
        validation: built.validation,
        error: null,
      };
    });
  }

  identifyJourneyStages(
    input: IdentifyJourneyStagesInput,
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyRunReport {
    return this.runAction("identify_stages", config, () => {
      const result = this.processCustomer(input.customerId, config);
      appendCjiLog({
        event: "journey_analysis",
        level: "info",
        details: `Identified stage for ${input.customerId}`,
      });
      return result;
    });
  }

  detectDropOffPoints(
    input: DetectDropOffPointsInput,
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyRunReport {
    return this.runAction("detect_dropoff", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) return this.emptyResult(customer.error);

      const signals = this.gatherSignals(input.customerId);
      const dropOff = this.analyticsEngine.detectDropOff(signals, config.dropOffInactivityDays);
      const built = this.buildJourneyRecord(input.customerId, config);
      if (!built.record) return this.emptyResult(built.error, built.validation);

      const insights: JourneyInsight[] = [];
      if (dropOff.length > 0) {
        const insight = this.metadataGenerator.buildInsight({
          customerId: input.customerId,
          journeyRecordId: built.record.journeyRecordId,
          insightType: "dropoff",
          message: `Drop-off detected: ${dropOff.join(", ")}`,
        });
        this.registry.storeInsight(insight);
        insights.push(insight);
      }

      return {
        journeyRecords: [built.record],
        insights: [...built.insights, ...insights],
        failures: [],
        validation: built.validation,
        error: null,
      };
    });
  }

  detectFrictionPoints(
    input: DetectFrictionPointsInput,
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyRunReport {
    return this.runAction("detect_friction", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) return this.emptyResult(customer.error);

      const signals = this.gatherSignals(input.customerId);
      const friction = this.analyticsEngine.detectFriction(
        signals,
        config.frictionSentimentThreshold,
      );
      const built = this.buildJourneyRecord(input.customerId, config);
      if (!built.record) return this.emptyResult(built.error, built.validation);

      const insights: JourneyInsight[] = [];
      if (friction.length > 0) {
        const insight = this.metadataGenerator.buildInsight({
          customerId: input.customerId,
          journeyRecordId: built.record.journeyRecordId,
          insightType: "friction",
          message: `Friction detected: ${friction.join(", ")}`,
        });
        this.registry.storeInsight(insight);
        insights.push(insight);
      }

      return {
        journeyRecords: [built.record],
        insights: [...built.insights, ...insights],
        failures: [],
        validation: built.validation,
        error: null,
      };
    });
  }

  measureJourneyPerformance(
    input: MeasureJourneyPerformanceInput,
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyRunReport {
    return this.runAction("measure_performance", config, () =>
      this.processCustomer(input.customerId, config),
    );
  }

  measureConversionRates(
    input: MeasureConversionRatesInput,
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyRunReport {
    return this.runAction("measure_conversion", config, () => {
      const customerIds = input.customerId
        ? [input.customerId]
        : [...new Set(this.registry.listRecords().map((r) => r.customerId))];

      const records: JourneyRecord[] = [];
      const insights: JourneyInsight[] = [];
      let validation = this.validator.validateEngineRecord(this.engineRecord!);

      for (const customerId of customerIds) {
        const result = this.processCustomer(customerId, config);
        if (result.error) continue;
        records.push(...result.journeyRecords);
        insights.push(...result.insights);
        validation = result.validation;
      }

      if (records.length === 0 && input.customerId) {
        return this.emptyResult(`No conversion data for ${input.customerId}`, validation);
      }

      return { journeyRecords: records, insights, failures: [], validation, error: null };
    });
  }

  recommendJourneyImprovements(
    input: RecommendJourneyImprovementsInput,
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyRunReport {
    return this.runAction("recommend_improvements", config, () => {
      const result = this.processCustomer(input.customerId, config);
      if (result.error) return result;

      const summary = this.recommendationEngine.summarizeImprovements(result.journeyRecords);
      const insight = this.metadataGenerator.buildInsight({
        customerId: input.customerId,
        journeyRecordId: result.journeyRecords[0]?.journeyRecordId ?? "",
        insightType: "optimization",
        message: summary.join("; "),
      });
      this.registry.storeInsight(insight);

      appendCjiLog({
        event: "journey_optimization",
        level: "info",
        details: `Generated ${summary.length} improvement recommendation(s)`,
      });

      return {
        ...result,
        insights: [...result.insights, insight],
      };
    });
  }

  predictCustomerProgression(
    input: PredictCustomerProgressionInput,
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyRunReport {
    return this.runAction("predict_progression", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) return this.emptyResult(customer.error);

      const built = this.buildJourneyRecord(input.customerId, config);
      if (!built.record) return this.emptyResult(built.error, built.validation);

      const prediction = this.predictionEngine.predictNextStage(
        built.record.journeyStage,
        built.record.journeyScore,
        config,
      );

      const insight = this.metadataGenerator.buildInsight({
        customerId: input.customerId,
        journeyRecordId: built.record.journeyRecordId,
        insightType: "prediction",
        message: `Predicted next stage: ${prediction.predictedStage} (${prediction.confidence}% confidence)`,
      });
      this.registry.storeInsight(insight);

      appendCjiLog({
        event: "prediction_generation",
        level: "info",
        details: `Predicted ${prediction.predictedStage} for ${input.customerId}`,
      });

      return {
        journeyRecords: [built.record],
        insights: [...built.insights, insight],
        failures: [],
        validation: built.validation,
        error: null,
      };
    });
  }

  detectJourneyFailures(
    input: DetectJourneyFailuresInput,
    config: CustomerJourneyIntelligenceConfiguration,
  ): JourneyRunReport {
    return this.runAction("detect_failures", config, () => {
      const detected: JourneyFailure[] = [];
      const records = input.journeyRecordId
        ? [this.registry.getRecord(input.journeyRecordId)].filter(Boolean)
        : this.registry.listRecords();

      for (const record of records as JourneyRecord[]) {
        if (record.validationStatus === "failed" || record.journeyScore < config.minJourneyScore) {
          detected.push(
            this.metadataGenerator.buildFailure({
              journeyRecordId: record.journeyRecordId,
              reason:
                record.validationStatus === "failed"
                  ? "Validation failed on journey record"
                  : "Journey score below minimum threshold",
              severity: record.journeyScore < 20 ? "high" : "medium",
            }),
          );
        }
      }

      for (const failure of detected) this.registry.storeFailure(failure);

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      if (detected.length > 0) validation.decision = "partial";

      return {
        journeyRecords: records as JourneyRecord[],
        insights: [],
        failures: detected,
        validation,
        error: null,
      };
    });
  }

  reportJourneyStatus(config: CustomerJourneyIntelligenceConfiguration): JourneyRunReport {
    return this.runAction("report_status", config, () => ({
      journeyRecords: this.registry.listRecords(),
      insights: this.registry.listInsights(),
      failures: this.registry.listFailures(),
      validation: this.validator.validateEngineRecord(this.engineRecord!),
      error: null,
    }));
  }

  reportJourneyHealth(config: CustomerJourneyIntelligenceConfiguration): JourneyRunReport {
    return this.runAction("report_health", config, () => {
      const records = this.registry.listRecords();
      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      validation.warnings.push(
        `Health snapshot: ${records.length} journey record(s) · ${this.registry.listInsights().length} insight(s)`,
      );
      return {
        journeyRecords: records.slice(-10),
        insights: this.registry.listInsights().slice(-5),
        failures: [],
        validation,
        error: null,
      };
    });
  }

  private processCustomer(
    customerId: string,
    config: CustomerJourneyIntelligenceConfiguration,
  ) {
    const customer = this.resolveCustomer(customerId);
    if (!customer.valid) return this.emptyResult(customer.error);

    const built = this.buildJourneyRecord(customerId, config);
    if (!built.record) return this.emptyResult(built.error, built.validation);

    appendCjiLog({
      event: "journey_mapping",
      level: "info",
      details: `Mapped journey for ${customerId} · stage ${built.record.journeyStage}`,
    });

    return {
      journeyRecords: [built.record],
      insights: built.insights,
      failures: [] as JourneyFailure[],
      validation: built.validation,
      error: null,
    };
  }

  private emptyResult(error: string | null, validation?: JourneyRunReport["validation"]) {
    const v =
      validation ??
      (() => {
        const base = this.validator.validateEngineRecord(this.engineRecord!);
        if (error) {
          base.decision = "fail";
          base.errors.push(error);
        }
        return base;
      })();
    return {
      journeyRecords: [] as JourneyRecord[],
      insights: [] as JourneyInsight[],
      failures: [] as JourneyFailure[],
      validation: v,
      error,
    };
  }

  private runAction(
    action: JourneyRunReport["action"],
    config: CustomerJourneyIntelligenceConfiguration,
    fn: () => {
      journeyRecords: JourneyRecord[];
      insights: JourneyInsight[];
      failures: JourneyFailure[];
      validation: JourneyRunReport["validation"];
      error: string | null;
    },
  ): JourneyRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Customer Journey Intelligence Engine not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      journeyRecords: result.journeyRecords,
      insights: result.insights,
      failures: result.failures,
      validation: result.validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
  }
}
