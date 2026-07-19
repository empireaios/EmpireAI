/** R4-13 — Returns Intelligence Manager. */

import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { AiCustomerSupport } from "../ai-customer-support/engine.js";
import type { TicketManagementEngine } from "../ticket-management-engine/engine.js";
import type { ReturnManagementEngine } from "../return-management/engine.js";
import { appendRieLog } from "./rie-logging.js";
import { ReturnIntelligenceRegistry } from "./return-intelligence-registry.js";
import { ReturnMetadataGenerator } from "./return-metadata-generator.js";
import { ReturnAnalysisEngine } from "./return-analysis-engine.js";
import { ReturnDecisionEngine } from "./return-decision-engine.js";
import { ReturnHistoryEngine } from "./return-history-engine.js";
import { CustomerReturnProfileEngine } from "./customer-return-profile-engine.js";
import { ReturnInsightsEngine } from "./return-insights-engine.js";
import { ReturnValidator, ReturnValidationEngine } from "./return-validator.js";
import type { ReturnsIntelligenceEngineConfiguration } from "./configuration.js";
import type {
  AnalyzeReturnHistoryInput,
  ConnectReturnsIntelligenceEngineInput,
  CoordinateCustomerCommunicationsInput,
  DetectAbnormalReturnBehaviorInput,
  DetectRepeatReturnPatternsInput,
  DetectReturnFailuresInput,
  EvaluateReturnEligibilityInput,
  GenerateReturnInsightsInput,
  ReceiveReturnRequestInput,
  RecommendReturnDecisionInput,
  ReturnInsight,
  ReturnIntelligenceFailure,
  ReturnIntelligenceRecord,
  ReturnsIntelligenceEngineRecord,
  ReturnsIntelligenceRunReport,
  TrackReturnLifecycleInput,
} from "./types.js";

export class ReturnsIntelligenceManager {
  private engineRecord: ReturnsIntelligenceEngineRecord | null = null;
  private readonly registry = new ReturnIntelligenceRegistry();
  private readonly metadataGenerator = new ReturnMetadataGenerator();
  private readonly analysisEngine = new ReturnAnalysisEngine();
  private readonly decisionEngine = new ReturnDecisionEngine();
  private readonly historyEngine = new ReturnHistoryEngine();
  private readonly profileEngine = new CustomerReturnProfileEngine();
  private readonly insightsEngine = new ReturnInsightsEngine();
  private readonly validationEngine = new ReturnValidationEngine();
  private readonly validator = new ReturnValidator();
  private readonly failures: ReturnIntelligenceFailure[] = [];

  constructor(
    private readonly identityEngine: CustomerIdentityEngine | null,
    private readonly crmFoundation: CrmFoundationEngine | null,
    private readonly timelineEngine: CustomerTimelineEngine | null,
    private readonly aiCustomerSupport: AiCustomerSupport | null,
    private readonly ticketManagementEngine: TicketManagementEngine | null,
    private readonly returnManagementEngine: ReturnManagementEngine | null,
  ) {}

  getEngineRecord(): ReturnsIntelligenceEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): ReturnIntelligenceRegistry {
    return this.registry;
  }

  getReturnIntelligenceRecords(): ReturnIntelligenceRecord[] {
    return this.registry.listRecords();
  }

  getInsightsEngine(): ReturnInsightsEngine {
    return this.insightsEngine;
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

  private isReturnManagementConnected(): boolean {
    try {
      return (this.returnManagementEngine?.getRecords().length ?? 0) >= 0;
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
    const hasCrm =
      this.crmFoundation?.getCrmRecords().some((p) => p.customerId === customerId) ?? false;
    const hasTimeline =
      this.timelineEngine?.getTimelineRecords().some((r) => r.customerId === customerId) ?? false;

    if (!hasIdentity && !hasCrm && !hasTimeline) {
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
      /* best-effort */
    }
  }

  private hasOpenTicket(customerId: string): boolean {
    try {
      return (
        this.ticketManagementEngine
          ?.getTicketRecords()
          .some(
            (t) =>
              t.customerId === customerId &&
              t.resolutionStatus !== "resolved" &&
              t.currentStatus !== "closed",
          ) ?? false
      );
    } catch {
      return false;
    }
  }

  private getOperationalReturnRecords(customerId: string) {
    try {
      return (
        this.returnManagementEngine
          ?.getRecords()
          .filter((r) => r.customerReference === customerId) ?? []
      );
    } catch {
      return [];
    }
  }

  private buildIntelligenceRecord(
    input: ReceiveReturnRequestInput,
    config: ReturnsIntelligenceEngineConfiguration,
  ): { record: ReturnIntelligenceRecord | null; validation: ReturnsIntelligenceRunReport["validation"]; error: string | null } {
    const customer = this.resolveCustomer(input.customerId);
    if (!customer.valid) {
      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      validation.decision = "fail";
      validation.errors.push(customer.error ?? "Invalid customer");
      return { record: null, validation, error: customer.error };
    }

    const history = this.historyEngine.summarize(
      this.registry.listRecords(),
      input.customerId,
    );
    const eligibility = this.analysisEngine.isEligible({
      priorReturnCountThisMonth: history.returnsThisMonth,
      config,
    });
    if (!eligibility.eligible) {
      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      validation.decision = "fail";
      validation.errors.push(...eligibility.errors);
      return { record: null, validation, error: eligibility.errors.join("; ") };
    }

    const riskScore = this.analysisEngine.calculateRiskScore({
      returnReason: input.returnReason,
      priorReturnCount: history.totalReturns,
      hasOpenTicket: this.hasOpenTicket(input.customerId),
      config,
    });
    const recommendedAction = this.decisionEngine.recommendAction({
      returnRiskScore: riskScore,
      config,
    });

    let record = this.metadataGenerator.buildReturnIntelligenceRecord({
      customerId: input.customerId,
      returnReference: input.returnReference?.trim() ?? `ret-${Date.now()}`,
      orderReference: input.orderReference.trim(),
      productReference: input.productReference?.trim() ?? "unknown",
      returnReason: input.returnReason,
      returnRiskScore: riskScore,
      recommendedAction,
      validationStatus: "pending",
    });

    const validation = this.validationEngine.validateReturnIntelligenceRecord(record, config);
    if (validation.decision === "fail") {
      return { record: null, validation, error: validation.errors.join("; ") };
    }

    record = {
      ...record,
      validationStatus: validation.decision === "pass" ? "passed" : "partial",
    };
    return { record, validation, error: null };
  }

  connectReturnsIntelligenceEngine(
    _input: ConnectReturnsIntelligenceEngineInput,
    config: ReturnsIntelligenceEngineConfiguration,
  ): ReturnsIntelligenceRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState: configValidation.decision === "fail" ? "failed" : "active",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      identityEngineConnected: this.isEngineConnected(this.identityEngine),
      crmFoundationConnected: this.isEngineConnected(this.crmFoundation),
      timelineEngineConnected: this.isEngineConnected(this.timelineEngine),
      aiCustomerSupportConnected: this.isEngineConnected(this.aiCustomerSupport),
      ticketManagementEngineConnected: this.isEngineConnected(this.ticketManagementEngine),
      returnManagementEngineConnected: this.isReturnManagementConnected(),
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

    appendRieLog({
      event: "engine_initialization",
      level: "info",
      details: `Returns Intelligence Engine connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      returnIntelligenceRecords: [],
      insights: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  receiveReturnRequest(
    input: ReceiveReturnRequestInput,
    config: ReturnsIntelligenceEngineConfiguration,
  ): ReturnsIntelligenceRunReport {
    return this.runAction("receive_request", config, () => {
      const requestKey = `req:${input.customerId}:${input.orderReference}:${input.returnReference ?? ""}`;
      if (config.validationRulesEnabled && this.registry.hasRequestKey(requestKey)) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Duplicate return request detected");
        return this.emptyResult(validation, "Duplicate return request detected");
      }

      const built = this.buildIntelligenceRecord(input, config);
      if (!built.record) {
        return this.emptyResult(built.validation, built.error);
      }

      this.registry.storeRecord(built.record, requestKey);
      this.recordToTimeline(
        input.customerId,
        `Return request analyzed: ${built.record.recommendedAction} recommended (risk ${built.record.returnRiskScore})`,
        built.record.returnIntelligenceId,
      );

      appendRieLog({
        event: "return_analysis",
        level: "info",
        details: `Return ${built.record.returnReference} risk=${built.record.returnRiskScore} action=${built.record.recommendedAction}`,
      });

      return {
        returnIntelligenceRecords: [built.record],
        insights: [],
        failures: [],
        validation: built.validation,
        error: null,
      };
    });
  }

  evaluateReturnEligibility(
    input: EvaluateReturnEligibilityInput,
    config: ReturnsIntelligenceEngineConfiguration,
  ): ReturnsIntelligenceRunReport {
    return this.runAction("evaluate_eligibility", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      const history = this.historyEngine.summarize(this.registry.listRecords(), input.customerId);
      const eligibility = this.analysisEngine.isEligible({
        priorReturnCountThisMonth: history.returnsThisMonth,
        config,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      if (!eligibility.eligible) {
        validation.decision = "fail";
        validation.errors.push(...eligibility.errors);
        return this.emptyResult(validation, eligibility.errors.join("; "));
      }

      appendRieLog({
        event: "return_analysis",
        level: "info",
        details: `Eligibility passed for ${input.customerId} order ${input.orderReference}`,
      });

      return {
        returnIntelligenceRecords: [],
        insights: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  analyzeReturnHistory(
    input: AnalyzeReturnHistoryInput,
    config: ReturnsIntelligenceEngineConfiguration,
  ): ReturnsIntelligenceRunReport {
    return this.runAction("analyze_history", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      const history = this.historyEngine.summarize(this.registry.listRecords(), input.customerId);
      const latest = this.registry
        .listRecords()
        .filter((r) => r.customerId === input.customerId)
        .at(-1);

      const insights: ReturnInsight[] = [];
      if (latest) {
        insights.push(
          this.insightsEngine.buildHistoryInsight(
            input.customerId,
            latest.returnIntelligenceId,
            history,
          ),
        );
        for (const insight of insights) this.registry.storeInsight(insight);
      }

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      appendRieLog({
        event: "return_analysis",
        level: "info",
        details: `History analysis: ${history.totalReturns} return(s) for ${input.customerId}`,
      });

      return {
        returnIntelligenceRecords: latest ? [latest] : [],
        insights,
        failures: [],
        validation,
        error: null,
      };
    });
  }

  detectAbnormalReturnBehavior(
    input: DetectAbnormalReturnBehaviorInput,
    config: ReturnsIntelligenceEngineConfiguration,
  ): ReturnsIntelligenceRunReport {
    return this.runAction("detect_abnormal", config, () => {
      if (!config.abnormalDetectionEnabled) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.warnings.push("Abnormal detection disabled");
        return { returnIntelligenceRecords: [], insights: [], failures: [], validation, error: null };
      }

      const records = input.customerId
        ? this.registry.listRecords().filter((r) => r.customerId === input.customerId)
        : this.registry.listRecords();

      const abnormalRecords = records.filter((r) => {
        const profile = this.profileEngine.buildProfile(records, r.customerId, config);
        return profile.abnormalBehaviorDetected;
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      appendRieLog({
        event: "return_analysis",
        level: abnormalRecords.length > 0 ? "warn" : "info",
        details: `Abnormal behavior: ${abnormalRecords.length} record(s) flagged`,
      });

      return {
        returnIntelligenceRecords: abnormalRecords,
        insights: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  detectRepeatReturnPatterns(
    input: DetectRepeatReturnPatternsInput,
    config: ReturnsIntelligenceEngineConfiguration,
  ): ReturnsIntelligenceRunReport {
    return this.runAction("detect_repeat", config, () => {
      if (!config.repeatPatternDetectionEnabled) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.warnings.push("Repeat pattern detection disabled");
        return { returnIntelligenceRecords: [], insights: [], failures: [], validation, error: null };
      }

      const records = input.customerId
        ? this.registry.listRecords().filter((r) => r.customerId === input.customerId)
        : this.registry.listRecords();

      const insights: ReturnInsight[] = [];
      const matchedRecords: ReturnIntelligenceRecord[] = [];
      const customerIds = [...new Set(records.map((r) => r.customerId))];

      for (const customerId of customerIds) {
        const profile = this.profileEngine.buildProfile(records, customerId, config);
        if (profile.repeatPatternDetected) {
          const latest = records.filter((r) => r.customerId === customerId).at(-1);
          if (latest) {
            matchedRecords.push(latest);
            const insight = this.insightsEngine.buildPatternInsight(
              customerId,
              latest.returnIntelligenceId,
              profile,
            );
            insights.push(insight);
            this.registry.storeInsight(insight);
          }
        }
      }

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      appendRieLog({
        event: "return_analysis",
        level: "info",
        details: `Repeat patterns: ${matchedRecords.length} customer(s) flagged`,
      });

      return {
        returnIntelligenceRecords: matchedRecords,
        insights,
        failures: [],
        validation,
        error: null,
      };
    });
  }

  recommendReturnDecision(
    input: RecommendReturnDecisionInput,
    config: ReturnsIntelligenceEngineConfiguration,
  ): ReturnsIntelligenceRunReport {
    return this.runAction("recommend_decision", config, () => {
      const existing = this.registry.getRecord(input.returnIntelligenceId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(`Return intelligence record ${input.returnIntelligenceId} not found`);
        return this.emptyResult(validation, "Record not found");
      }

      const recommendedAction = this.decisionEngine.recommendAction({
        returnRiskScore: existing.returnRiskScore,
        config,
      });

      const updated: ReturnIntelligenceRecord = {
        ...existing,
        recommendedAction,
        timestamp: new Date().toISOString(),
      };
      this.registry.storeRecord(updated);

      appendRieLog({
        event: "return_recommendation",
        level: "info",
        details: `Recommendation ${recommendedAction} for ${updated.returnIntelligenceId}`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        returnIntelligenceRecords: [updated],
        insights: [],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  trackReturnLifecycle(
    input: TrackReturnLifecycleInput,
    config: ReturnsIntelligenceEngineConfiguration,
  ): ReturnsIntelligenceRunReport {
    return this.runAction("track_lifecycle", config, () => {
      const operational = this.getOperationalReturnRecords(input.customerId ?? "");
      const match =
        operational.find((r) => r.returnId === input.returnReference) ??
        operational.find((r) => r.orderReference === input.returnReference) ??
        null;

      const intelligenceRecords = this.registry
        .listRecords()
        .filter((r) => r.returnReference === input.returnReference);

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      if (!match && intelligenceRecords.length === 0) {
        validation.decision = "partial";
        validation.warnings.push("No matching return lifecycle found");
      }

      const insight =
        intelligenceRecords[0] &&
        this.metadataGenerator.buildInsight({
          customerId: intelligenceRecords[0].customerId,
          returnIntelligenceId: intelligenceRecords[0].returnIntelligenceId,
          insightType: "lifecycle",
          summary: match
            ? `Operational return ${match.returnId} status: ${match.returnCompletionStatus}`
            : `Lifecycle tracked for reference ${input.returnReference}`,
        });

      const insights: ReturnInsight[] = [];
      if (insight) {
        this.registry.storeInsight(insight);
        insights.push(insight);
      }

      appendRieLog({
        event: "return_analysis",
        level: "info",
        details: `Lifecycle tracked for ${input.returnReference}`,
      });

      return {
        returnIntelligenceRecords: intelligenceRecords,
        insights,
        failures: [],
        validation,
        error: null,
      };
    });
  }

  coordinateCustomerCommunications(
    input: CoordinateCustomerCommunicationsInput,
    config: ReturnsIntelligenceEngineConfiguration,
  ): ReturnsIntelligenceRunReport {
    return this.runAction("coordinate_communication", config, () => {
      const record = this.registry.getRecord(input.returnIntelligenceId);
      if (!record) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Return intelligence record not found");
        return this.emptyResult(validation, "Record not found");
      }

      const summary =
        input.communicationSummary?.trim() ??
        `Return update for order ${record.orderReference}: recommended action is ${record.recommendedAction}`;

      this.recordToTimeline(
        record.customerId,
        summary,
        record.returnIntelligenceId,
      );

      const insight = this.metadataGenerator.buildInsight({
        customerId: record.customerId,
        returnIntelligenceId: record.returnIntelligenceId,
        insightType: "communication",
        summary,
      });
      this.registry.storeInsight(insight);

      appendRieLog({
        event: "return_analysis",
        level: "info",
        details: `Communication coordinated for ${record.returnIntelligenceId}`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        returnIntelligenceRecords: [record],
        insights: [insight],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  generateReturnInsights(
    input: GenerateReturnInsightsInput,
    config: ReturnsIntelligenceEngineConfiguration,
  ): ReturnsIntelligenceRunReport {
    return this.runAction("generate_insights", config, () => {
      const records = input.customerId
        ? this.registry.listRecords().filter((r) => r.customerId === input.customerId)
        : input.returnIntelligenceId
          ? this.registry.listRecords().filter((r) => r.returnIntelligenceId === input.returnIntelligenceId)
          : this.registry.listRecords();

      const insights: ReturnInsight[] = [];
      for (const record of records.slice(-5)) {
        const history = this.historyEngine.summarize(this.registry.listRecords(), record.customerId);
        const profile = this.profileEngine.buildProfile(
          this.registry.listRecords(),
          record.customerId,
          config,
        );
        const historyInsight = this.insightsEngine.buildHistoryInsight(
          record.customerId,
          record.returnIntelligenceId,
          history,
        );
        const patternInsight = this.insightsEngine.buildPatternInsight(
          record.customerId,
          record.returnIntelligenceId,
          profile,
        );
        insights.push(historyInsight, patternInsight);
        this.registry.storeInsight(historyInsight);
        this.registry.storeInsight(patternInsight);
      }

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      appendRieLog({
        event: "return_analysis",
        level: "info",
        details: `Generated ${insights.length} return insight(s)`,
      });

      return {
        returnIntelligenceRecords: records.slice(-5),
        insights,
        failures: [],
        validation,
        error: null,
      };
    });
  }

  detectReturnFailures(
    input: DetectReturnFailuresInput,
    config: ReturnsIntelligenceEngineConfiguration,
  ): ReturnsIntelligenceRunReport {
    return this.runAction("detect_failures", config, () => {
      const detected: ReturnIntelligenceFailure[] = [];
      const records = input.returnIntelligenceId
        ? [this.registry.getRecord(input.returnIntelligenceId)].filter(Boolean)
        : this.registry.listRecords();

      for (const record of records as ReturnIntelligenceRecord[]) {
        if (record.validationStatus === "failed") {
          detected.push(
            this.metadataGenerator.buildFailure({
              returnIntelligenceId: record.returnIntelligenceId,
              reason: "Validation failed on return intelligence record",
              severity: "high",
            }),
          );
        }
      }

      for (const failure of detected) {
        this.registry.storeFailure(failure);
        this.failures.push(failure);
      }

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      if (detected.length > 0) validation.decision = "partial";

      appendRieLog({
        event: "return_intelligence_failure",
        level: detected.length > 0 ? "warn" : "info",
        details: `${detected.length} failure(s) detected`,
      });

      return {
        returnIntelligenceRecords: records as ReturnIntelligenceRecord[],
        insights: [],
        failures: detected,
        validation,
        error: null,
      };
    });
  }

  reportReturnStatus(config: ReturnsIntelligenceEngineConfiguration): ReturnsIntelligenceRunReport {
    return this.runAction("report_status", config, () => {
      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        returnIntelligenceRecords: this.registry.listRecords(),
        insights: this.registry.listInsights(),
        failures: this.registry.listFailures(),
        validation,
        error: null,
      };
    });
  }

  reportReturnHealth(config: ReturnsIntelligenceEngineConfiguration): ReturnsIntelligenceRunReport {
    return this.runAction("report_health", config, () => {
      const summary = this.insightsEngine.summarize(
        this.registry.listRecords(),
        this.registry.listInsights(),
      );
      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      validation.warnings.push(
        `Health snapshot: ${summary.totalRecords} records · ${summary.highRiskReturns} high risk`,
      );
      return {
        returnIntelligenceRecords: this.registry.listRecords().slice(-10),
        insights: this.registry.listInsights().slice(-5),
        failures: [],
        validation,
        error: null,
      };
    });
  }

  private emptyResult(
    validation: ReturnsIntelligenceRunReport["validation"],
    error: string | null,
  ) {
    return {
      returnIntelligenceRecords: [] as ReturnIntelligenceRecord[],
      insights: [] as ReturnInsight[],
      failures: [] as ReturnIntelligenceFailure[],
      validation,
      error,
    };
  }

  private runAction(
    action: ReturnsIntelligenceRunReport["action"],
    config: ReturnsIntelligenceEngineConfiguration,
    fn: () => {
      returnIntelligenceRecords: ReturnIntelligenceRecord[];
      insights: ReturnInsight[];
      failures: ReturnIntelligenceFailure[];
      validation: ReturnsIntelligenceRunReport["validation"];
      error: string | null;
    },
  ): ReturnsIntelligenceRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Returns Intelligence Engine not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      returnIntelligenceRecords: result.returnIntelligenceRecords,
      insights: result.insights,
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
