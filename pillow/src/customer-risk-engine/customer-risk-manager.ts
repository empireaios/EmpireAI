/** R4-14 — Customer Risk Manager. */

import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { TicketManagementEngine } from "../ticket-management-engine/engine.js";
import type { CustomerSentimentEngine } from "../customer-sentiment-engine/engine.js";
import type { ReviewManagementEngine } from "../review-management-engine/engine.js";
import type { ReturnsIntelligenceEngine } from "../returns-intelligence-engine/engine.js";
import { appendCreLog } from "./cre-logging.js";
import { CustomerRiskRegistry } from "./customer-risk-registry.js";
import { CustomerRiskMetadataGenerator } from "./customer-risk-metadata-generator.js";
import { FraudDetectionEngine } from "./fraud-detection-engine.js";
import { AbuseDetectionEngine } from "./abuse-detection-engine.js";
import { BehaviourAnalysisEngine } from "./behaviour-analysis-engine.js";
import { CustomerRiskScoringEngine } from "./customer-risk-scoring-engine.js";
import { RiskRecommendationEngine } from "./risk-recommendation-engine.js";
import { CustomerRiskValidator, CustomerRiskValidationEngine } from "./customer-risk-validator.js";
import type { CustomerRiskEngineConfiguration } from "./configuration.js";
import type {
  CalculateCustomerRiskScoreInput,
  ConnectCustomerRiskEngineInput,
  CustomerRiskAlert,
  CustomerRiskEngineRecord,
  CustomerRiskFailure,
  CustomerRiskRecord,
  CustomerRiskRunReport,
  DetectAccountAbuseInput,
  DetectCustomerRiskFailuresInput,
  DetectFraudIndicatorsInput,
  DetectSuspiciousCommunicationInput,
  DetectSuspiciousPurchasingInput,
  DetectSuspiciousReturnBehaviourInput,
  EvaluateCustomerRiskInput,
  GenerateCustomerRiskAlertsInput,
  RecommendMitigationActionsInput,
  RiskCategory,
} from "./types.js";

export class CustomerRiskManager {
  private engineRecord: CustomerRiskEngineRecord | null = null;
  private readonly registry = new CustomerRiskRegistry();
  private readonly metadataGenerator = new CustomerRiskMetadataGenerator();
  private readonly fraudEngine = new FraudDetectionEngine();
  private readonly abuseEngine = new AbuseDetectionEngine();
  private readonly behaviourEngine = new BehaviourAnalysisEngine();
  private readonly scoringEngine = new CustomerRiskScoringEngine();
  private readonly recommendationEngine = new RiskRecommendationEngine();
  private readonly validationEngine = new CustomerRiskValidationEngine();
  private readonly validator = new CustomerRiskValidator();

  constructor(
    private readonly identityEngine: CustomerIdentityEngine | null,
    private readonly crmFoundation: CrmFoundationEngine | null,
    private readonly timelineEngine: CustomerTimelineEngine | null,
    private readonly ticketManagementEngine: TicketManagementEngine | null,
    private readonly sentimentEngine: CustomerSentimentEngine | null,
    private readonly reviewManagementEngine: ReviewManagementEngine | null,
    private readonly returnsIntelligenceEngine: ReturnsIntelligenceEngine | null,
  ) {}

  getEngineRecord(): CustomerRiskEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): CustomerRiskRegistry {
    return this.registry;
  }

  getCustomerRiskRecords(): CustomerRiskRecord[] {
    return this.registry.listRecords();
  }

  getRecommendationEngine(): RiskRecommendationEngine {
    return this.recommendationEngine;
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

  private gatherSignals(customerId: string) {
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const returnRecords =
      this.returnsIntelligenceEngine
        ?.getReturnIntelligenceRecords()
        .filter((r) => r.customerId === customerId) ?? [];
    const returnCountThisMonth = returnRecords.filter(
      (r) => new Date(r.timestamp).getTime() >= oneMonthAgo,
    ).length;
    const highRiskReturnCount = returnRecords.filter((r) => r.returnRiskScore >= 65).length;
    const maxReturnRisk =
      returnRecords.length > 0 ? Math.max(...returnRecords.map((r) => r.returnRiskScore)) : 0;

    const sentimentRecords =
      this.sentimentEngine?.getSentimentRecords().filter((r) => r.customerId === customerId) ?? [];
    const negativeSentimentCount = sentimentRecords.filter((r) => r.sentimentScore < 0).length;
    const avgSentiment =
      sentimentRecords.length > 0
        ? sentimentRecords.reduce((s, r) => s + r.sentimentScore, 0) / sentimentRecords.length
        : 0;

    const tickets =
      this.ticketManagementEngine?.getTicketRecords().filter((t) => t.customerId === customerId) ??
      [];
    const openTicketCount = tickets.filter(
      (t) => t.resolutionStatus !== "resolved" && t.currentStatus !== "closed",
    ).length;

    const reviews =
      this.reviewManagementEngine?.getReviewRecords().filter((r) => r.customerId === customerId) ??
      [];
    const negativeReviewCount = reviews.filter((r) => r.reviewSentiment === "negative").length;

    const timelineEvents =
      this.timelineEngine?.getTimelineRecords().filter((r) => r.customerId === customerId) ?? [];

    return {
      returnCount: returnRecords.length,
      returnCountThisMonth,
      highRiskReturnCount,
      maxReturnRisk,
      negativeSentimentCount,
      avgSentiment,
      openTicketCount,
      ticketCount: tickets.length,
      negativeReviewCount,
      timelineEventCount: timelineEvents.length,
      recentTimelineEvents: timelineEvents.filter(
        (r) => new Date(r.timestamp).getTime() >= oneMonthAgo,
      ).length,
    };
  }

  private buildRiskRecord(
    customerId: string,
    category: RiskCategory,
    indicators: string[],
    score: number,
    config: CustomerRiskEngineConfiguration,
  ): { record: CustomerRiskRecord | null; validation: CustomerRiskRunReport["validation"]; error: string | null } {
    const riskLevel = this.scoringEngine.resolveRiskLevel(score, config);
    const recommendedAction = this.recommendationEngine.recommend({
      riskLevel,
      indicators,
      config,
    });
    const alertStatus =
      config.alertRulesEnabled && score >= (config.alertRules[0]?.minScoreForAlert ?? 50)
        ? "active"
        : "pending";

    let record = this.metadataGenerator.buildCustomerRiskRecord({
      customerId,
      riskCategory: category,
      riskIndicators: indicators,
      riskScore: score,
      riskLevel,
      recommendedAction,
      alertStatus,
      validationStatus: "pending",
    });

    const validation = this.validationEngine.validateCustomerRiskRecord(record, config);
    if (validation.decision === "fail") {
      return { record: null, validation, error: validation.errors.join("; ") };
    }

    record = {
      ...record,
      validationStatus: validation.decision === "pass" ? "passed" : "partial",
    };
    return { record, validation, error: null };
  }

  connectCustomerRiskEngine(
    _input: ConnectCustomerRiskEngineInput,
    config: CustomerRiskEngineConfiguration,
  ): CustomerRiskRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState: configValidation.decision === "fail" ? "failed" : "active",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      identityEngineConnected: this.isEngineConnected(this.identityEngine),
      crmFoundationConnected: this.isEngineConnected(this.crmFoundation),
      timelineEngineConnected: this.isEngineConnected(this.timelineEngine),
      ticketManagementEngineConnected: this.isEngineConnected(this.ticketManagementEngine),
      sentimentEngineConnected: this.isEngineConnected(this.sentimentEngine),
      reviewManagementEngineConnected: this.isEngineConnected(this.reviewManagementEngine),
      returnsIntelligenceEngineConnected: this.isEngineConnected(this.returnsIntelligenceEngine),
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

    appendCreLog({
      event: "engine_initialization",
      level: "info",
      details: `Customer Risk Engine connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      customerRiskRecords: [],
      alerts: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  evaluateCustomerRisk(
    input: EvaluateCustomerRiskInput,
    config: CustomerRiskEngineConfiguration,
  ): CustomerRiskRunReport {
    return this.runAction("evaluate_risk", config, () =>
      this.evaluateCustomerRiskCore(input.customerId, input.riskCategory ?? "composite", config),
    );
  }

  private evaluateCustomerRiskCore(
    customerId: string,
    category: RiskCategory,
    config: CustomerRiskEngineConfiguration,
  ) {
    const customer = this.resolveCustomer(customerId);
    if (!customer.valid) {
      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      validation.decision = "fail";
      validation.errors.push(customer.error ?? "Invalid customer");
      return this.emptyResult(validation, customer.error);
    }

    const signals = this.gatherSignals(customerId);
    const fraud = this.fraudEngine.detect(signals, config);
    const abuse = this.abuseEngine.detect({
      returnCountThisMonth: signals.returnCountThisMonth,
      ticketCount: signals.ticketCount,
      timelineEventCount: signals.timelineEventCount,
      config,
    });
    const behaviourCtx = {
      returnRiskScore: signals.maxReturnRisk,
      sentimentScore: signals.avgSentiment,
      openTickets: signals.openTicketCount,
      negativeReviews: signals.negativeReviewCount,
      recentTimelineEvents: signals.recentTimelineEvents,
    };
    const purchasing = this.behaviourEngine.analyzePurchasing(behaviourCtx);
    const returns = this.behaviourEngine.analyzeReturns(behaviourCtx);
    const communication = this.behaviourEngine.analyzeCommunication(behaviourCtx);

    const score = this.scoringEngine.aggregateScores([
      fraud.score,
      abuse.score,
      purchasing.score,
      returns.score,
      communication.score,
    ]);
    const indicators = [
      ...fraud.indicators,
      ...abuse.indicators,
      ...purchasing.indicators,
      ...returns.indicators,
      ...communication.indicators,
    ];

    const built = this.buildRiskRecord(customerId, category, [...new Set(indicators)], score, config);
    if (!built.record) return this.emptyResult(built.validation, built.error);

    this.registry.storeRecord(built.record);
    appendCreLog({
      event: "risk_evaluation",
      level: "info",
      details: `Risk evaluated for ${customerId}: score=${score} level=${built.record.riskLevel}`,
    });

    return {
      customerRiskRecords: [built.record],
      alerts: [],
      failures: [],
      validation: built.validation,
      error: null,
    };
  }

  detectFraudIndicators(
    input: DetectFraudIndicatorsInput,
    config: CustomerRiskEngineConfiguration,
  ): CustomerRiskRunReport {
    return this.runAction("detect_fraud", config, () =>
      this.detectCategory(input.customerId, "fraud", config, (signals) =>
        this.fraudEngine.detect(signals, config),
      ),
    );
  }

  detectAccountAbuse(
    input: DetectAccountAbuseInput,
    config: CustomerRiskEngineConfiguration,
  ): CustomerRiskRunReport {
    return this.runAction("detect_abuse", config, () => {
      const signals = this.gatherSignals(input.customerId);
      const abuse = this.abuseEngine.detect({
        returnCountThisMonth: signals.returnCountThisMonth,
        ticketCount: signals.ticketCount,
        timelineEventCount: signals.timelineEventCount,
        config,
      });
      return this.storeCategoryResult(input.customerId, "abuse", abuse.indicators, abuse.score, config);
    });
  }

  detectSuspiciousPurchasingBehaviour(
    input: DetectSuspiciousPurchasingInput,
    config: CustomerRiskEngineConfiguration,
  ): CustomerRiskRunReport {
    return this.runAction("detect_purchasing", config, () => {
      const signals = this.gatherSignals(input.customerId);
      const result = this.behaviourEngine.analyzePurchasing({
        returnRiskScore: signals.maxReturnRisk,
        sentimentScore: signals.avgSentiment,
        openTickets: signals.openTicketCount,
        negativeReviews: signals.negativeReviewCount,
        recentTimelineEvents: signals.recentTimelineEvents,
      });
      return this.storeCategoryResult(
        input.customerId,
        "purchasing",
        result.indicators,
        result.score,
        config,
      );
    });
  }

  detectSuspiciousReturnBehaviour(
    input: DetectSuspiciousReturnBehaviourInput,
    config: CustomerRiskEngineConfiguration,
  ): CustomerRiskRunReport {
    return this.runAction("detect_returns", config, () => {
      const signals = this.gatherSignals(input.customerId);
      const result = this.behaviourEngine.analyzeReturns({
        returnRiskScore: signals.maxReturnRisk,
        sentimentScore: signals.avgSentiment,
        openTickets: signals.openTicketCount,
        negativeReviews: signals.negativeReviewCount,
        recentTimelineEvents: signals.recentTimelineEvents,
      });
      return this.storeCategoryResult(input.customerId, "returns", result.indicators, result.score, config);
    });
  }

  detectSuspiciousCommunicationPatterns(
    input: DetectSuspiciousCommunicationInput,
    config: CustomerRiskEngineConfiguration,
  ): CustomerRiskRunReport {
    return this.runAction("detect_communication", config, () => {
      const signals = this.gatherSignals(input.customerId);
      const result = this.behaviourEngine.analyzeCommunication({
        returnRiskScore: signals.maxReturnRisk,
        sentimentScore: signals.avgSentiment,
        openTickets: signals.openTicketCount,
        negativeReviews: signals.negativeReviewCount,
        recentTimelineEvents: signals.recentTimelineEvents,
      });
      return this.storeCategoryResult(
        input.customerId,
        "communication",
        result.indicators,
        result.score,
        config,
      );
    });
  }

  calculateCustomerRiskScore(
    input: CalculateCustomerRiskScoreInput,
    config: CustomerRiskEngineConfiguration,
  ): CustomerRiskRunReport {
    return this.runAction("calculate_score", config, () =>
      this.evaluateCustomerRiskCore(input.customerId, "composite", config),
    );
  }

  generateCustomerRiskAlerts(
    input: GenerateCustomerRiskAlertsInput,
    config: CustomerRiskEngineConfiguration,
  ): CustomerRiskRunReport {
    return this.runAction("generate_alerts", config, () => {
      const records = input.customerId
        ? this.registry.listRecords().filter((r) => r.customerId === input.customerId)
        : this.registry.listRecords();

      const alerts: CustomerRiskAlert[] = [];
      for (const record of records) {
        if (!config.alertRulesEnabled) continue;
        const minScore = config.alertRules.find((r) => r.enabled)?.minScoreForAlert ?? 50;
        if (record.riskScore < minScore) continue;

        const alert = this.metadataGenerator.buildAlert({
          customerId: record.customerId,
          customerRiskId: record.customerRiskId,
          alertType: record.riskCategory,
          severity: record.riskLevel,
          message: `Customer risk alert: ${record.riskLevel} (${record.riskScore}) — ${record.riskIndicators.join(", ")}`,
        });
        this.registry.storeAlert(alert);
        alerts.push(alert);
        record.alertStatus = "active";
        this.registry.storeRecord(record);
      }

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      appendCreLog({
        event: "risk_score_calculation",
        level: "info",
        details: `Generated ${alerts.length} customer risk alert(s)`,
      });

      return {
        customerRiskRecords: records.slice(-5),
        alerts,
        failures: [],
        validation,
        error: null,
      };
    });
  }

  recommendMitigationActions(
    input: RecommendMitigationActionsInput,
    config: CustomerRiskEngineConfiguration,
  ): CustomerRiskRunReport {
    return this.runAction("recommend_mitigation", config, () => {
      const existing = this.registry.getRecord(input.customerRiskId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Customer risk record not found");
        return this.emptyResult(validation, "Record not found");
      }

      const recommendedAction = this.recommendationEngine.recommend({
        riskLevel: existing.riskLevel,
        indicators: existing.riskIndicators,
        config,
      });
      const updated = { ...existing, recommendedAction, timestamp: new Date().toISOString() };
      this.registry.storeRecord(updated);

      appendCreLog({
        event: "risk_evaluation",
        level: "info",
        details: `Mitigation ${recommendedAction} for ${updated.customerRiskId}`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        customerRiskRecords: [updated],
        alerts: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  detectCustomerRiskFailures(
    input: DetectCustomerRiskFailuresInput,
    config: CustomerRiskEngineConfiguration,
  ): CustomerRiskRunReport {
    return this.runAction("detect_failures", config, () => {
      const detected: CustomerRiskFailure[] = [];
      const records = input.customerRiskId
        ? [this.registry.getRecord(input.customerRiskId)].filter(Boolean)
        : this.registry.listRecords();

      for (const record of records as CustomerRiskRecord[]) {
        if (record.validationStatus === "failed") {
          detected.push(
            this.metadataGenerator.buildFailure({
              customerRiskId: record.customerRiskId,
              reason: "Validation failed on customer risk record",
              severity: "high",
            }),
          );
        }
      }

      for (const failure of detected) this.registry.storeFailure(failure);

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      if (detected.length > 0) validation.decision = "partial";

      return {
        customerRiskRecords: records as CustomerRiskRecord[],
        alerts: [],
        failures: detected,
        validation,
        error: null,
      };
    });
  }

  reportCustomerRiskStatus(config: CustomerRiskEngineConfiguration): CustomerRiskRunReport {
    return this.runAction("report_status", config, () => ({
      customerRiskRecords: this.registry.listRecords(),
      alerts: this.registry.listAlerts(),
      failures: this.registry.listFailures(),
      validation: this.validator.validateEngineRecord(this.engineRecord!),
      error: null,
    }));
  }

  reportCustomerRiskHealth(config: CustomerRiskEngineConfiguration): CustomerRiskRunReport {
    return this.runAction("report_health", config, () => {
      const records = this.registry.listRecords();
      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      validation.warnings.push(
        `Health snapshot: ${records.length} records · ${this.registry.listAlerts().length} alerts`,
      );
      return {
        customerRiskRecords: records.slice(-10),
        alerts: this.registry.listAlerts().slice(-5),
        failures: [],
        validation,
        error: null,
      };
    });
  }

  private detectCategory(
    customerId: string,
    category: RiskCategory,
    config: CustomerRiskEngineConfiguration,
    fn: (signals: ReturnType<CustomerRiskManager["gatherSignals"]>) => {
      indicators: string[];
      score: number;
    },
  ) {
    const customer = this.resolveCustomer(customerId);
    if (!customer.valid) {
      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      validation.decision = "fail";
      validation.errors.push(customer.error ?? "Invalid customer");
      return this.emptyResult(validation, customer.error);
    }

    const signals = this.gatherSignals(customerId);
    const result = fn(signals);
    return this.storeCategoryResult(customerId, category, result.indicators, result.score, config);
  }

  private storeCategoryResult(
    customerId: string,
    category: RiskCategory,
    indicators: string[],
    score: number,
    config: CustomerRiskEngineConfiguration,
  ) {
    const built = this.buildRiskRecord(customerId, category, indicators, score, config);
    if (!built.record) return this.emptyResult(built.validation, built.error);

    this.registry.storeRecord(built.record);
    appendCreLog({
      event: category === "fraud" ? "fraud_detection" : "risk_evaluation",
      level: score >= config.highRiskThreshold ? "warn" : "info",
      details: `${category} detection for ${customerId}: score=${score}`,
    });

    return {
      customerRiskRecords: [built.record],
      alerts: [],
      failures: [],
      validation: built.validation,
      error: null,
    };
  }

  private emptyResult(
    validation: CustomerRiskRunReport["validation"],
    error: string | null,
  ) {
    return {
      customerRiskRecords: [] as CustomerRiskRecord[],
      alerts: [] as CustomerRiskAlert[],
      failures: [] as CustomerRiskFailure[],
      validation,
      error,
    };
  }

  private runAction(
    action: CustomerRiskRunReport["action"],
    config: CustomerRiskEngineConfiguration,
    fn: () => {
      customerRiskRecords: CustomerRiskRecord[];
      alerts: CustomerRiskAlert[];
      failures: CustomerRiskFailure[];
      validation: CustomerRiskRunReport["validation"];
      error: string | null;
    },
  ): CustomerRiskRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Customer Risk Engine not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      customerRiskRecords: result.customerRiskRecords,
      alerts: result.alerts,
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
