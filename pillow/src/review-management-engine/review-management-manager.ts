/** R4-11 — Review Management Manager. */

import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { CustomerSentimentEngine } from "../customer-sentiment-engine/engine.js";
import type { AiCustomerSupport } from "../ai-customer-support/engine.js";
import { appendRmeLog } from "./rme-logging.js";
import { ReviewRegistry } from "./review-registry.js";
import { ReviewMetadataGenerator } from "./review-metadata-generator.js";
import { ReviewCollectionEngine } from "./review-collection-engine.js";
import { ReviewClassificationEngine } from "./review-classification-engine.js";
import { ReputationMonitoringEngine } from "./reputation-monitoring-engine.js";
import { ReviewTrendEngine } from "./review-trend-engine.js";
import { ReviewAlertEngine } from "./review-alert-engine.js";
import { ReviewValidationEngine } from "./review-validation-engine.js";
import { ReviewValidator } from "./review-validator.js";
import type { ReviewManagementEngineConfiguration } from "./configuration.js";
import type {
  ClassifyReviewSentimentInput,
  CollectCustomerReviewInput,
  ConnectReviewManagementEngineInput,
  DetectNegativeReviewsInput,
  DetectPositiveReviewsInput,
  DetectReviewFailuresInput,
  GenerateReputationAlertsInput,
  ImportMarketplaceReviewInput,
  ReputationAlert,
  ReviewEngineRecord,
  ReviewFailure,
  ReviewRecord,
  ReviewRunReport,
  ReviewTrend,
  TrackReviewTrendsInput,
} from "./types.js";

export class ReviewManagementManager {
  private engineRecord: ReviewEngineRecord | null = null;
  private readonly registry = new ReviewRegistry();
  private readonly metadataGenerator = new ReviewMetadataGenerator();
  private readonly collectionEngine = new ReviewCollectionEngine();
  private readonly classificationEngine = new ReviewClassificationEngine();
  private readonly reputationEngine = new ReputationMonitoringEngine();
  private readonly trendEngine = new ReviewTrendEngine();
  private readonly alertEngine = new ReviewAlertEngine();
  private readonly validationEngine = new ReviewValidationEngine();
  private readonly validator = new ReviewValidator();
  private readonly failures: ReviewFailure[] = [];

  constructor(
    private readonly identityEngine: CustomerIdentityEngine | null,
    private readonly timelineEngine: CustomerTimelineEngine | null,
    private readonly sentimentEngine: CustomerSentimentEngine | null,
    private readonly aiCustomerSupport: AiCustomerSupport | null,
  ) {}

  getEngineRecord(): ReviewEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): ReviewRegistry {
    return this.registry;
  }

  getReviewRecords(): ReviewRecord[] {
    return this.registry.listRecords();
  }

  getReputationEngine(): ReputationMonitoringEngine {
    return this.reputationEngine;
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
    if (!customerId?.trim()) {
      return { valid: false, error: "Customer ID is required" };
    }

    const hasIdentity =
      this.identityEngine
        ?.getCustomerRecords()
        .some((r) => r.customerId === customerId) ?? false;
    const hasTimeline =
      this.timelineEngine?.getTimelineRecords().some((r) => r.customerId === customerId) ?? false;
    const hasAiSupport =
      this.aiCustomerSupport?.getAiSupportRecords().some((r) => r.customerId === customerId) ??
      false;

    if (!hasIdentity && !hasTimeline && !hasAiSupport) {
      return { valid: false, error: `No customer records found for ${customerId}` };
    }
    return { valid: true, error: null };
  }

  private recordToTimeline(customerId: string, description: string, reference: string): void {
    try {
      this.timelineEngine?.recordSupportActivity({
        customerId,
        eventReference: reference,
        eventDescription: description,
        eventSource: "support",
      });
    } catch {
      // best-effort
    }
  }

  private classifyWithSentimentEngine(comment: string, customerId: string) {
    if (!this.sentimentEngine || !comment.trim()) return null;
    try {
      const report = this.sentimentEngine.analyzeCustomerMessage({
        customerId,
        messageText: comment,
        communicationChannel: "email",
      });
      const record = report.sentimentRecords[0];
      if (!record) return null;
      if (record.sentimentCategory === "positive" || record.sentimentCategory === "satisfied") {
        return "positive" as const;
      }
      if (
        record.sentimentCategory === "negative" ||
        record.sentimentCategory === "frustrated" ||
        record.sentimentCategory === "escalation_risk"
      ) {
        return "negative" as const;
      }
      return "neutral" as const;
    } catch {
      return null;
    }
  }

  private storeRecordWithAlerts(
    record: ReviewRecord,
    config: ReviewManagementEngineConfiguration,
  ): { record: ReviewRecord; alerts: ReputationAlert[] } {
    const alerts = this.alertEngine.generateAlerts(record, config);
    const alertStatus = alerts.length > 0 ? "pending" : record.alertStatus;
    const updated = { ...record, alertStatus: alertStatus as ReviewRecord["alertStatus"] };
    this.registry.storeRecord(updated);
    for (const alert of alerts) {
      this.registry.storeAlert(alert);
    }
    return { record: updated, alerts };
  }

  connectReviewManagementEngine(
    _input: ConnectReviewManagementEngineInput,
    config: ReviewManagementEngineConfiguration,
  ): ReviewRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState: configValidation.decision === "fail" ? "failed" : "active",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      identityEngineConnected: this.isEngineConnected(this.identityEngine),
      timelineEngineConnected: this.isEngineConnected(this.timelineEngine),
      sentimentEngineConnected: this.isEngineConnected(this.sentimentEngine),
      aiCustomerSupportConnected: this.isEngineConnected(this.aiCustomerSupport),
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

    appendRmeLog({
      event: "engine_initialization",
      level: "info",
      details: `Review Management Engine connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      reviewRecords: [],
      alerts: [],
      trends: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  collectCustomerReview(
    input: CollectCustomerReviewInput,
    config: ReviewManagementEngineConfiguration,
  ): ReviewRunReport {
    return this.runAction("collect_review", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      const collection = this.collectionEngine.validateCollection(input, config);
      if (!collection.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(...collection.errors);
        return this.emptyResult(validation, collection.errors.join("; "));
      }

      const sentimentFromEngine = this.classifyWithSentimentEngine(
        collection.normalizedComment,
        input.customerId,
      );
      const sentiment =
        sentimentFromEngine ??
        this.classificationEngine.classifyReview(
          {
            reviewRating: collection.normalizedRating,
            reviewComment: collection.normalizedComment,
          },
          config,
        );

      let record = this.metadataGenerator.buildReviewRecord({
        customerId: input.customerId,
        marketplaceReference: String(input.marketplaceReference),
        productReference: input.productReference,
        orderReference: input.orderReference ?? "",
        reviewRating: collection.normalizedRating,
        reviewComment: collection.normalizedComment,
        reviewSentiment: sentiment,
        reviewStatus: "collected",
      });

      const validation = this.validationEngine.validateReviewRecord(record, config);
      if (validation.decision === "fail") {
        return this.emptyResult(validation, validation.errors.join("; "));
      }

      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      record.reviewStatus = "classified";
      const { record: stored, alerts } = this.storeRecordWithAlerts(record, config);

      this.recordToTimeline(
        input.customerId,
        `Review collected: ${stored.reviewRating}/5 (${stored.reviewSentiment}) on ${stored.productReference}`,
        stored.reviewRecordId,
      );

      appendRmeLog({
        event: "review_collection",
        level: "info",
        details: `Review ${stored.reviewRecordId}: ${stored.reviewRating}/5 ${stored.reviewSentiment}`,
      });

      return {
        reviewRecords: [stored],
        alerts,
        trends: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  importMarketplaceReview(
    input: ImportMarketplaceReviewInput,
    config: ReviewManagementEngineConfiguration,
  ): ReviewRunReport {
    return this.runAction("import_marketplace_review", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      const importKey = `import:${input.marketplaceReference}:${input.externalReviewId}`;
      if (config.duplicateDetectionEnabled && this.registry.hasImportKey(importKey)) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Duplicate marketplace review import detected");
        return this.emptyResult(validation, "Duplicate marketplace review import detected");
      }

      const errors: string[] = [];
      if (config.marketplaceImportRulesEnabled) {
        const marketplace = String(input.marketplaceReference).toLowerCase();
        const rule = config.marketplaceImportRules.find(
          (r) => r.enabled && r.marketplace === marketplace,
        );
        if (rule?.requireOrderReference && !input.orderReference?.trim()) {
          errors.push("Order reference is required for marketplace import");
        }
        if (rule?.requireExternalReviewId && !input.externalReviewId?.trim()) {
          errors.push("External review ID is required for marketplace import");
        }
      }

      if (input.reviewRating < 1 || input.reviewRating > 5) {
        errors.push("Review rating must be between 1 and 5");
      }
      if (!input.reviewComment?.trim()) {
        errors.push("Review comment is required for marketplace import");
      }

      if (errors.length > 0) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(...errors);
        return this.emptyResult(validation, errors.join("; "));
      }

      const sentimentFromEngine = this.classifyWithSentimentEngine(
        input.reviewComment,
        input.customerId,
      );
      const sentiment =
        sentimentFromEngine ??
        this.classificationEngine.classifyReview(
          { reviewRating: input.reviewRating, reviewComment: input.reviewComment },
          config,
        );

      let record = this.metadataGenerator.buildReviewRecord({
        customerId: input.customerId,
        marketplaceReference: String(input.marketplaceReference),
        productReference: input.productReference,
        orderReference: input.orderReference,
        reviewRating: input.reviewRating,
        reviewComment: input.reviewComment.trim(),
        reviewSentiment: sentiment,
        reviewStatus: "imported",
      });

      const validation = this.validationEngine.validateReviewRecord(record, config);
      if (validation.decision === "fail") {
        return this.emptyResult(validation, validation.errors.join("; "));
      }

      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      record.reviewStatus = "classified";
      this.registry.storeRecord(record, importKey);
      const { record: stored, alerts } = this.storeRecordWithAlerts(record, config);

      this.recordToTimeline(
        input.customerId,
        `Marketplace review imported: ${stored.reviewRating}/5 from ${stored.marketplaceReference}`,
        stored.reviewRecordId,
      );

      appendRmeLog({
        event: "review_import",
        level: "info",
        details: `Imported ${stored.reviewRecordId} from ${stored.marketplaceReference}`,
      });

      return {
        reviewRecords: [stored],
        alerts,
        trends: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  classifyReviewSentiment(
    input: ClassifyReviewSentimentInput,
    config: ReviewManagementEngineConfiguration,
  ): ReviewRunReport {
    return this.runAction("classify_sentiment", config, () => {
      const existing = this.registry.getRecord(input.reviewRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Review record not found");
        return this.emptyResult(validation, "Review record not found");
      }

      const sentimentFromEngine = this.classifyWithSentimentEngine(
        existing.reviewComment,
        existing.customerId,
      );
      const sentiment =
        sentimentFromEngine ??
        this.classificationEngine.classifyReview(existing, config);

      const updated: ReviewRecord = {
        ...existing,
        reviewSentiment: sentiment,
        reviewStatus: "classified",
        timestamp: new Date().toISOString(),
      };

      this.registry.storeRecord(updated);

      appendRmeLog({
        event: "reputation_analysis",
        level: "info",
        details: `Classified ${input.reviewRecordId} as ${sentiment}`,
      });

      const validation = this.validationEngine.validateReviewRecord(updated, config);
      return {
        reviewRecords: [updated],
        alerts: [],
        trends: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  detectNegativeReviews(
    input: DetectNegativeReviewsInput,
    config: ReviewManagementEngineConfiguration,
  ): ReviewRunReport {
    return this.detectBySentiment("detect_negative", config, input, "negative");
  }

  detectPositiveReviews(
    input: DetectPositiveReviewsInput,
    config: ReviewManagementEngineConfiguration,
  ): ReviewRunReport {
    return this.detectBySentiment("detect_positive", config, input, "positive");
  }

  private detectBySentiment(
    action: ReviewRunReport["action"],
    config: ReviewManagementEngineConfiguration,
    input: { customerId?: string; reviewRecordId?: string },
    sentiment: ReviewRecord["reviewSentiment"],
  ): ReviewRunReport {
    return this.runAction(action, config, () => {
      const records = input.reviewRecordId
        ? [this.registry.getRecord(input.reviewRecordId)].filter(Boolean) as ReviewRecord[]
        : this.registry
            .listRecords()
            .filter((r) => (input.customerId ? r.customerId === input.customerId : true));

      const matched = records.filter((r) => r.reviewSentiment === sentiment);
      const validation = this.validator.validateEngineRecord(this.engineRecord!);

      appendRmeLog({
        event: action,
        level: matched.length > 0 ? "info" : "debug",
        details: `${action}: ${matched.length} match(es)`,
      });

      return {
        reviewRecords: matched,
        alerts: this.registry.listAlerts().filter((a) =>
          matched.some((r) => r.reviewRecordId === a.reviewRecordId),
        ),
        trends: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  trackReviewTrends(
    input: TrackReviewTrendsInput,
    config: ReviewManagementEngineConfiguration,
  ): ReviewRunReport {
    return this.runAction("track_trends", config, () => {
      const trend = this.trendEngine.trackTrends(this.registry.listRecords(), config, input);
      if (trend) {
        this.registry.storeTrend(trend);
      }

      appendRmeLog({
        event: "trend_analysis",
        level: "info",
        details: trend
          ? `Trend ${trend.trendDirection} avg rating ${trend.averageRating}`
          : "Insufficient reviews for trend",
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        reviewRecords: this.registry.listRecords().filter((r) => {
          if (input.marketplaceReference && r.marketplaceReference !== input.marketplaceReference) {
            return false;
          }
          if (input.productReference && r.productReference !== input.productReference) {
            return false;
          }
          return true;
        }),
        alerts: [],
        trends: trend ? [trend] : [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  generateReputationAlerts(
    input: GenerateReputationAlertsInput,
    config: ReviewManagementEngineConfiguration,
  ): ReviewRunReport {
    return this.runAction("generate_alerts", config, () => {
      const records = input.reviewRecordId
        ? [this.registry.getRecord(input.reviewRecordId)].filter(Boolean) as ReviewRecord[]
        : this.registry.listRecords();

      const allAlerts: ReputationAlert[] = [];
      const updatedRecords: ReviewRecord[] = [];

      for (const record of records) {
        const { record: stored, alerts } = this.storeRecordWithAlerts(record, config);
        updatedRecords.push(stored);
        allAlerts.push(...alerts);
      }

      appendRmeLog({
        event: "alert_generation",
        level: allAlerts.length > 0 ? "warn" : "info",
        details: `Generated ${allAlerts.length} reputation alert(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        reviewRecords: updatedRecords,
        alerts: allAlerts,
        trends: [],
        failures: [],
        validation,
        error: allAlerts.length > 0 ? "Reputation alerts generated" : null,
      };
    });
  }

  detectReviewFailures(
    input: DetectReviewFailuresInput,
    config: ReviewManagementEngineConfiguration,
  ): ReviewRunReport {
    return this.runAction("detect_failures", config, () => {
      const records = input.reviewRecordId
        ? [this.registry.getRecord(input.reviewRecordId)].filter(Boolean) as ReviewRecord[]
        : this.registry.listRecords();

      const detected: ReviewFailure[] = [];
      for (const record of records) {
        if (record.validationStatus === "failed") {
          detected.push(
            this.metadataGenerator.buildFailure(
              record.reviewRecordId,
              `Review record ${record.reviewRecordId} failed validation`,
              "high",
            ),
          );
        }
      }

      for (const f of detected) {
        if (
          !this.failures.some(
            (x) => x.reviewRecordId === f.reviewRecordId && x.reason === f.reason,
          )
        ) {
          this.failures.push(f);
        }
      }

      appendRmeLog({
        event: "review_failure",
        level: detected.length > 0 ? "warn" : "info",
        details: `Detected ${detected.length} review failure(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        reviewRecords: records,
        alerts: [],
        trends: [],
        failures: detected,
        validation,
        error: detected.length > 0 ? "Review failures detected" : null,
      };
    });
  }

  reportReviewStatus(config: ReviewManagementEngineConfiguration): ReviewRunReport {
    return this.runAction("report_status", config, () => {
      const summary = this.reputationEngine.summarize(
        this.registry.listRecords(),
        this.registry.listAlerts().filter((a) => a.severity !== "low").length,
      );

      appendRmeLog({
        event: "performance_statistics",
        level: "info",
        details: `Status: ${summary.totalReviews} reviews · reputation ${summary.reputationScore}`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        reviewRecords: this.registry.listRecords(),
        alerts: this.registry.listAlerts(),
        trends: this.registry.listTrends(),
        failures: [...this.failures],
        validation,
        error: null,
      };
    });
  }

  reportReviewHealth(config: ReviewManagementEngineConfiguration): ReviewRunReport {
    return this.runAction("report_health", config, () => {
      const summary = this.reputationEngine.summarize(
        this.registry.listRecords(),
        this.registry.listAlerts().length,
      );

      appendRmeLog({
        event: "health_information",
        level: "info",
        details: `Health report: ${summary.positiveReviews} positive · ${summary.negativeReviews} negative`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        reviewRecords: [],
        alerts: [],
        trends: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  private emptyResult(validation: ReviewRunReport["validation"], error: string | null) {
    return {
      reviewRecords: [] as ReviewRecord[],
      alerts: [] as ReputationAlert[],
      trends: [] as ReviewTrend[],
      failures: [] as ReviewFailure[],
      validation,
      error,
    };
  }

  private runAction(
    action: ReviewRunReport["action"],
    config: ReviewManagementEngineConfiguration,
    fn: () => {
      reviewRecords: ReviewRecord[];
      alerts: ReputationAlert[];
      trends: ReviewTrend[];
      failures: ReviewFailure[];
      validation: ReviewRunReport["validation"];
      error: string | null;
    },
  ): ReviewRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Review Management Engine not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      reviewRecords: result.reviewRecords,
      alerts: result.alerts,
      trends: result.trends,
      failures: result.failures,
      validation: result.validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.failures.length = 0;
  }
}
