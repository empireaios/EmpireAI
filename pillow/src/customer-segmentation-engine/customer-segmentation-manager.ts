/** R4-16 — Customer Segmentation Manager. */

import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { CustomerSentimentEngine } from "../customer-sentiment-engine/engine.js";
import type { LoyaltyProgrammeEngine } from "../loyalty-programme-engine/engine.js";
import type { CustomerRiskEngine } from "../customer-risk-engine/engine.js";
import type { CustomerLifetimeValueEngine } from "../customer-lifetime-value-engine/engine.js";
import { appendCsegLog } from "./cseg-logging.js";
import { SegmentationRegistry } from "./segmentation-registry.js";
import { SegmentationMetadataGenerator } from "./segmentation-metadata-generator.js";
import { SegmentationEngine } from "./segmentation-engine.js";
import { BehaviourAnalysisEngine } from "./behaviour-analysis-engine.js";
import { CustomerClassificationEngine } from "./customer-classification-engine.js";
import { DynamicSegmentManager } from "./dynamic-segment-manager.js";
import { SegmentationAnalyticsEngine } from "./segmentation-analytics-engine.js";
import { SegmentationValidator, SegmentationValidationEngine } from "./segmentation-validator.js";
import type { CustomerSegmentationEngineConfiguration } from "./configuration.js";
import type {
  AssignCustomerToSegmentsInput,
  ConnectSegmentationEngineInput,
  CreateCustomerSegmentInput,
  CustomerSegmentSignals,
  DetectSegmentChangesInput,
  DetectSegmentationFailuresInput,
  SegmentationEngineRecord,
  SegmentationFailure,
  SegmentationRecord,
  SegmentationRunReport,
  SegmentChange,
  SegmentCustomerInput,
  SegmentType,
} from "./types.js";

export class CustomerSegmentationManager {
  private engineRecord: SegmentationEngineRecord | null = null;
  private readonly registry = new SegmentationRegistry();
  private readonly metadataGenerator = new SegmentationMetadataGenerator();
  private readonly segmentationEngine = new SegmentationEngine();
  private readonly behaviourEngine = new BehaviourAnalysisEngine();
  private readonly classificationEngine = new CustomerClassificationEngine();
  private readonly dynamicManager = new DynamicSegmentManager();
  private readonly analyticsEngine = new SegmentationAnalyticsEngine();
  private readonly validationEngine = new SegmentationValidationEngine();
  private readonly validator = new SegmentationValidator();

  constructor(
    private readonly identityEngine: CustomerIdentityEngine | null,
    private readonly crmFoundation: CrmFoundationEngine | null,
    private readonly timelineEngine: CustomerTimelineEngine | null,
    private readonly sentimentEngine: CustomerSentimentEngine | null,
    private readonly loyaltyProgrammeEngine: LoyaltyProgrammeEngine | null,
    private readonly customerRiskEngine: CustomerRiskEngine | null,
    private readonly customerLifetimeValueEngine: CustomerLifetimeValueEngine | null,
  ) {}

  getEngineRecord(): SegmentationEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): SegmentationRegistry {
    return this.registry;
  }

  getSegmentationRecords(): SegmentationRecord[] {
    return this.registry.listRecords();
  }

  getMetadataGenerator(): SegmentationMetadataGenerator {
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

  gatherSignals(customerId: string): CustomerSegmentSignals {
    const crmProfile = this.crmFoundation?.getCrmRecords().find((p) => p.customerId === customerId);
    const timelineEvents =
      this.timelineEngine?.getTimelineRecords().filter((r) => r.customerId === customerId) ?? [];
    const purchaseCount = timelineEvents.filter((e) => e.eventType === "purchase").length;

    const clvRecords =
      this.customerLifetimeValueEngine?.getClvRecords().filter((r) => r.customerId === customerId) ??
      [];
    const latestClv = clvRecords.at(-1);

    const loyaltyRecords =
      this.loyaltyProgrammeEngine?.getLoyaltyRecords().filter((r) => r.customerId === customerId) ??
      [];
    const latestLoyalty = loyaltyRecords.at(-1);

    const sentimentRecords =
      this.sentimentEngine?.getSentimentRecords().filter((r) => r.customerId === customerId) ?? [];
    const avgSentiment =
      sentimentRecords.length > 0
        ? sentimentRecords.reduce((s, r) => s + r.sentimentScore, 0) / sentimentRecords.length
        : 50;
    const negativeSentimentCount = sentimentRecords.filter((r) => r.sentimentScore < 40).length;

    const riskRecords =
      this.customerRiskEngine?.getCustomerRiskRecords().filter((r) => r.customerId === customerId) ??
      [];
    const latestRisk = riskRecords.at(-1);

    return {
      customerOwner: crmProfile?.customerOwner ?? null,
      hasEmail: Boolean(crmProfile?.contactInformation.email),
      purchaseCount,
      timelineEventCount: timelineEvents.length,
      lifetimeValue: latestClv?.lifetimeValue ?? 0,
      loyaltyTier: latestLoyalty?.loyaltyTier ?? "bronze",
      loyaltyPoints: latestLoyalty?.currentPointsBalance ?? 0,
      avgSentimentScore: avgSentiment,
      negativeSentimentCount,
      riskScore: latestRisk?.riskScore ?? 0,
      riskLevel: latestRisk?.riskLevel ?? "low",
    };
  }

  private buildSegmentationRecord(
    customerId: string,
    config: CustomerSegmentationEngineConfiguration,
    segmentType?: SegmentType,
  ): {
    record: SegmentationRecord | null;
    change: SegmentChange | null;
    validation: SegmentationRunReport["validation"];
    error: string | null;
  } {
    const signals = this.gatherSignals(customerId);
    this.behaviourEngine.analyze(signals);

    let classification = segmentType
      ? (() => {
          const result = this.segmentationEngine.classifyByType(signals, segmentType, config);
          const composite = this.segmentationEngine.buildComposite(signals, config);
          return {
            ...composite,
            assignedSegments: [...new Set([...composite.assignedSegments, ...result.segments])],
            segmentConfidence: Math.max(composite.segmentConfidence, result.confidence),
          };
        })()
      : this.segmentationEngine.buildComposite(signals, config);

    classification = this.classificationEngine.applyClassificationRules(
      classification,
      signals,
      config,
    );

    if (classification.segmentConfidence < config.minSegmentConfidence) {
      classification.assignedSegments.push("needs_review");
    }

    let record = this.metadataGenerator.buildSegmentationRecord({
      customerId,
      assignedSegments: classification.assignedSegments,
      behaviourProfile: classification.behaviourProfile,
      loyaltyTier: classification.loyaltyTier,
      customerValueTier: classification.customerValueTier,
      riskTier: classification.riskTier,
      segmentConfidence: classification.segmentConfidence,
      validationStatus: "pending",
    });

    const validation = this.validationEngine.validateSegmentationRecord(record, config);
    if (validation.decision === "fail") {
      return { record: null, change: null, validation, error: validation.errors.join("; ") };
    }

    record = {
      ...record,
      validationStatus: validation.decision === "pass" ? "passed" : "partial",
    };

    const previous = this.registry.listRecordsForCustomer(customerId).at(-1) ?? null;
    this.registry.storeRecord(record);
    const change = this.dynamicManager.detectChanges({
      customerId,
      previous,
      current: record,
      config,
      registry: this.registry,
      metadataGenerator: this.metadataGenerator,
    });

    return { record, change, validation, error: null };
  }

  connectSegmentationEngine(
    _input: ConnectSegmentationEngineInput,
    config: CustomerSegmentationEngineConfiguration,
  ): SegmentationRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState: configValidation.decision === "fail" ? "failed" : "active",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      identityEngineConnected: this.isEngineConnected(this.identityEngine),
      crmFoundationConnected: this.isEngineConnected(this.crmFoundation),
      timelineEngineConnected: this.isEngineConnected(this.timelineEngine),
      sentimentEngineConnected: this.isEngineConnected(this.sentimentEngine),
      loyaltyProgrammeEngineConnected: this.isEngineConnected(this.loyaltyProgrammeEngine),
      customerRiskEngineConnected: this.isEngineConnected(this.customerRiskEngine),
      customerLifetimeValueEngineConnected: this.isEngineConnected(this.customerLifetimeValueEngine),
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

    appendCsegLog({
      event: "engine_initialization",
      level: "info",
      details: `Segmentation Engine connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      segments: [],
      segmentationRecords: [],
      segmentChanges: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  createCustomerSegment(
    input: CreateCustomerSegmentInput,
    config: CustomerSegmentationEngineConfiguration,
  ): SegmentationRunReport {
    return this.runAction("create_segment", config, () => {
      const segment = this.metadataGenerator.buildSegment({
        segmentName: input.segmentName,
        segmentType: input.segmentType,
        description: input.description ?? `${input.segmentType} segment: ${input.segmentName}`,
      });
      this.registry.storeSegment(segment);

      appendCsegLog({
        event: "segment_creation",
        level: "info",
        details: `Created segment ${segment.segmentName} (${segment.segmentType})`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        segments: [segment],
        segmentationRecords: [],
        segmentChanges: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  assignCustomerToSegments(
    input: AssignCustomerToSegmentsInput,
    config: CustomerSegmentationEngineConfiguration,
  ): SegmentationRunReport {
    return this.runAction("assign_segments", config, () => this.segmentCustomer(input, config));
  }

  segmentByDemographics(input: SegmentCustomerInput, config: CustomerSegmentationEngineConfiguration) {
    return this.runAction("segment_demographics", config, () =>
      this.segmentCustomer(input, config, "demographics"),
    );
  }

  segmentByPurchasingBehaviour(
    input: SegmentCustomerInput,
    config: CustomerSegmentationEngineConfiguration,
  ) {
    return this.runAction("segment_purchasing", config, () =>
      this.segmentCustomer(input, config, "purchasing"),
    );
  }

  segmentByCustomerValue(input: SegmentCustomerInput, config: CustomerSegmentationEngineConfiguration) {
    return this.runAction("segment_value", config, () =>
      this.segmentCustomer(input, config, "value"),
    );
  }

  segmentByLoyaltyStatus(input: SegmentCustomerInput, config: CustomerSegmentationEngineConfiguration) {
    return this.runAction("segment_loyalty", config, () =>
      this.segmentCustomer(input, config, "loyalty"),
    );
  }

  segmentByCustomerSentiment(
    input: SegmentCustomerInput,
    config: CustomerSegmentationEngineConfiguration,
  ) {
    return this.runAction("segment_sentiment", config, () =>
      this.segmentCustomer(input, config, "sentiment"),
    );
  }

  segmentByCustomerRisk(input: SegmentCustomerInput, config: CustomerSegmentationEngineConfiguration) {
    return this.runAction("segment_risk", config, () =>
      this.segmentCustomer(input, config, "risk"),
    );
  }

  detectSegmentChanges(
    input: DetectSegmentChangesInput,
    config: CustomerSegmentationEngineConfiguration,
  ): SegmentationRunReport {
    return this.runAction("detect_changes", config, () => {
      const customerIds = input.customerId
        ? [input.customerId]
        : [...new Set(this.registry.listRecords().map((r) => r.customerId))];

      const changes: SegmentChange[] = [];
      const records: SegmentationRecord[] = [];

      for (const customerId of customerIds) {
        const result = this.segmentCustomer({ customerId }, config);
        if (result.error) continue;
        records.push(...result.segmentationRecords);
        changes.push(...result.segmentChanges);
      }

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      appendCsegLog({
        event: "segment_update",
        level: "info",
        details: `Detected ${changes.length} segment change(s)`,
      });

      return {
        segments: this.registry.listSegments(),
        segmentationRecords: records,
        segmentChanges: changes,
        failures: [],
        validation,
        error: null,
      };
    });
  }

  detectSegmentationFailures(
    input: DetectSegmentationFailuresInput,
    config: CustomerSegmentationEngineConfiguration,
  ): SegmentationRunReport {
    return this.runAction("detect_failures", config, () => {
      const detected: SegmentationFailure[] = [];
      const records = input.segmentationRecordId
        ? [this.registry.getRecord(input.segmentationRecordId)].filter(Boolean)
        : this.registry.listRecords();

      for (const record of records as SegmentationRecord[]) {
        if (record.validationStatus === "failed") {
          detected.push(
            this.metadataGenerator.buildFailure({
              segmentationRecordId: record.segmentationRecordId,
              reason: "Validation failed on segmentation record",
              severity: "high",
            }),
          );
        }
      }

      for (const failure of detected) this.registry.storeFailure(failure);

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      if (detected.length > 0) validation.decision = "partial";

      return {
        segments: [],
        segmentationRecords: records as SegmentationRecord[],
        segmentChanges: [],
        failures: detected,
        validation,
        error: null,
      };
    });
  }

  reportSegmentationStatus(config: CustomerSegmentationEngineConfiguration): SegmentationRunReport {
    return this.runAction("report_status", config, () => {
      this.analyticsEngine.summarize(this.registry.listRecords(), this.registry.listSegments());
      return {
        segments: this.registry.listSegments(),
        segmentationRecords: this.registry.listRecords(),
        segmentChanges: this.registry.listChanges(),
        failures: this.registry.listFailures(),
        validation: this.validator.validateEngineRecord(this.engineRecord!),
        error: null,
      };
    });
  }

  reportSegmentationHealth(config: CustomerSegmentationEngineConfiguration): SegmentationRunReport {
    return this.runAction("report_health", config, () => {
      const records = this.registry.listRecords();
      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      validation.warnings.push(
        `Health snapshot: ${records.length} records · ${this.registry.listSegments().length} segments`,
      );
      return {
        segments: this.registry.listSegments().slice(-5),
        segmentationRecords: records.slice(-10),
        segmentChanges: this.registry.listChanges().slice(-5),
        failures: [],
        validation,
        error: null,
      };
    });
  }

  private segmentCustomer(
    input: SegmentCustomerInput,
    config: CustomerSegmentationEngineConfiguration,
    segmentType?: SegmentType,
  ) {
    const customer = this.resolveCustomer(input.customerId);
    if (!customer.valid) {
      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      validation.decision = "fail";
      validation.errors.push(customer.error ?? "Invalid customer");
      return this.emptyResult(validation, customer.error);
    }

    const built = this.buildSegmentationRecord(input.customerId, config, segmentType);
    if (!built.record) return this.emptyResult(built.validation, built.error);

    appendCsegLog({
      event: "segment_assignment",
      level: "info",
      details: `Assigned ${built.record.assignedSegments.length} segment(s) to ${input.customerId}`,
    });

    return {
      segments: this.registry.listSegments(),
      segmentationRecords: [built.record],
      segmentChanges: built.change ? [built.change] : [],
      failures: [],
      validation: built.validation,
      error: null,
    };
  }

  private emptyResult(validation: SegmentationRunReport["validation"], error: string | null) {
    return {
      segments: [] as SegmentationRunReport["segments"],
      segmentationRecords: [] as SegmentationRecord[],
      segmentChanges: [] as SegmentChange[],
      failures: [] as SegmentationFailure[],
      validation,
      error,
    };
  }

  private runAction(
    action: SegmentationRunReport["action"],
    config: CustomerSegmentationEngineConfiguration,
    fn: () => {
      segments: SegmentationRunReport["segments"];
      segmentationRecords: SegmentationRecord[];
      segmentChanges: SegmentChange[];
      failures: SegmentationFailure[];
      validation: SegmentationRunReport["validation"];
      error: string | null;
    },
  ): SegmentationRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Segmentation Engine not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      segments: result.segments,
      segmentationRecords: result.segmentationRecords,
      segmentChanges: result.segmentChanges,
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
