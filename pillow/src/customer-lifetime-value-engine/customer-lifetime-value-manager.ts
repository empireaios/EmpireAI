/** R4-15 — Customer Lifetime Value Manager. */

import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { LoyaltyProgrammeEngine } from "../loyalty-programme-engine/engine.js";
import type { CustomerRiskEngine } from "../customer-risk-engine/engine.js";
import { appendClveLog } from "./clve-logging.js";
import { ClvRegistry } from "./clv-registry.js";
import { ClvMetadataGenerator } from "./clv-metadata-generator.js";
import { ClvCalculationEngine } from "./clv-calculation-engine.js";
import { CustomerRevenueAnalyzer } from "./customer-revenue-analyzer.js";
import { CustomerProfitabilityEngine } from "./customer-profitability-engine.js";
import { CustomerRetentionEngine } from "./customer-retention-engine.js";
import { CustomerValuePredictionEngine } from "./customer-value-prediction-engine.js";
import { ClvValidator, ClvValidationEngine } from "./clv-validator.js";
import type { CustomerLifetimeValueEngineConfiguration } from "./configuration.js";
import type {
  CalculateCustomerLifetimeValueInput,
  ClvFailure,
  ClvInsight,
  ClvRecord,
  ClvRunReport,
  ConnectClvEngineInput,
  CustomerFinancialSignals,
  DetectClvFailuresInput,
  IdentifyDecliningCustomerValueInput,
  IdentifyHighValueCustomersInput,
  PredictFutureCustomerValueInput,
  TrackAverageOrderValueInput,
  TrackCustomerProfitabilityInput,
  TrackCustomerRetentionInput,
  TrackCustomerRevenueInput,
  TrackPurchaseFrequencyInput,
} from "./types.js";
import type { ClvEngineRecord } from "./types.js";

export class CustomerLifetimeValueManager {
  private engineRecord: ClvEngineRecord | null = null;
  private readonly registry = new ClvRegistry();
  private readonly metadataGenerator = new ClvMetadataGenerator();
  private readonly calculationEngine = new ClvCalculationEngine();
  private readonly revenueAnalyzer = new CustomerRevenueAnalyzer();
  private readonly profitabilityEngine = new CustomerProfitabilityEngine();
  private readonly retentionEngine = new CustomerRetentionEngine();
  private readonly predictionEngine = new CustomerValuePredictionEngine();
  private readonly validationEngine = new ClvValidationEngine();
  private readonly validator = new ClvValidator();

  constructor(
    private readonly identityEngine: CustomerIdentityEngine | null,
    private readonly crmFoundation: CrmFoundationEngine | null,
    private readonly timelineEngine: CustomerTimelineEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly loyaltyProgrammeEngine: LoyaltyProgrammeEngine | null,
    private readonly customerRiskEngine: CustomerRiskEngine | null,
  ) {}

  getEngineRecord(): ClvEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): ClvRegistry {
    return this.registry;
  }

  getClvRecords(): ClvRecord[] {
    return this.registry.listRecords();
  }

  getMetadataGenerator(): ClvMetadataGenerator {
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

  gatherSignals(customerId: string): CustomerFinancialSignals {
    const revenueRecords =
      this.revenueEngine
        ?.getRevenueRecords()
        .filter((r) => r.customerReference === customerId) ?? [];
    const revenueAnalysis = this.revenueAnalyzer.analyze(revenueRecords);

    const orderRefs = new Set(
      revenueRecords
        .map((r) => r.businessReference ?? r.paymentReference)
        .filter(Boolean) as string[],
    );
    const profitRecords =
      this.profitCalculationEngine
        ?.getProfitRecords()
        .filter(
          (p) =>
            (p.orderReference && orderRefs.has(p.orderReference)) ||
            (p.revenueReference &&
              revenueRecords.some((r) => r.revenueRecordId === p.revenueReference)),
        ) ?? [];

    const timelineEvents =
      this.timelineEngine?.getTimelineRecords().filter((r) => r.customerId === customerId) ?? [];
    const purchaseEvents = timelineEvents.filter((e) => e.eventType === "purchase");
    const purchaseFrequency =
      revenueAnalysis.purchaseFrequency > 0
        ? revenueAnalysis.purchaseFrequency
        : purchaseEvents.length;

    const loyaltyRecords =
      this.loyaltyProgrammeEngine
        ?.getLoyaltyRecords()
        .filter((r) => r.customerId === customerId) ?? [];
    const latestLoyalty = loyaltyRecords.at(-1);

    const riskRecords =
      this.customerRiskEngine
        ?.getCustomerRiskRecords()
        .filter((r) => r.customerId === customerId) ?? [];
    const maxRisk =
      riskRecords.length > 0 ? Math.max(...riskRecords.map((r) => r.riskScore)) : 0;

    const averageOrderValue =
      purchaseFrequency > 0
        ? Math.round((revenueAnalysis.revenueContribution / purchaseFrequency) * 100) / 100
        : revenueAnalysis.averageOrderValue;

    return {
      revenueContribution: revenueAnalysis.revenueContribution,
      profitContribution: profitRecords.reduce((sum, p) => sum + p.netProfit, 0),
      purchaseFrequency,
      averageOrderValue,
      retentionScore: 50,
      timelineEventCount: timelineEvents.length,
      loyaltyTier: latestLoyalty?.loyaltyTier ?? null,
      loyaltyPoints: latestLoyalty?.currentPointsBalance ?? 0,
      riskScore: maxRisk,
    };
  }

  private buildClvRecordFromSignals(
    customerId: string,
    signals: CustomerFinancialSignals,
    config: CustomerLifetimeValueEngineConfiguration,
  ): { record: ClvRecord | null; validation: ClvRunReport["validation"]; error: string | null } {
    const orderRefs = new Set<string>();
    const revenueRecords =
      this.revenueEngine
        ?.getRevenueRecords()
        .filter((r) => r.customerReference === customerId) ?? [];
    for (const r of revenueRecords) {
      if (r.businessReference) orderRefs.add(r.businessReference);
      if (r.paymentReference) orderRefs.add(r.paymentReference);
    }
    const profitRecords =
      this.profitCalculationEngine
        ?.getProfitRecords()
        .filter(
          (p) =>
            (p.orderReference && orderRefs.has(p.orderReference)) ||
            (p.revenueReference &&
              revenueRecords.some((rec) => rec.revenueRecordId === p.revenueReference)),
        ) ?? [];

    const profitAnalysis = this.profitabilityEngine.analyze(
      profitRecords,
      signals.revenueContribution,
      config,
    );
    signals.profitContribution = profitAnalysis.profitContribution;

    const retention = this.retentionEngine.analyze({
      timelineEventCount: signals.timelineEventCount,
      purchaseFrequency: signals.purchaseFrequency,
      loyaltyTier: signals.loyaltyTier,
      loyaltyPoints: signals.loyaltyPoints,
      riskScore: signals.riskScore,
      config,
    });
    signals.retentionScore = retention.retentionScore;

    const { lifetimeValue } = this.calculationEngine.calculate(signals, config);
    const { predictedLifetimeValue } = this.predictionEngine.predict({
      lifetimeValue,
      averageOrderValue: signals.averageOrderValue,
      purchaseFrequency: signals.purchaseFrequency,
      retentionScore: signals.retentionScore,
      config,
    });

    let record = this.metadataGenerator.buildClvRecord({
      customerId,
      revenueContribution: signals.revenueContribution,
      profitContribution: signals.profitContribution,
      purchaseFrequency: signals.purchaseFrequency,
      averageOrderValue: signals.averageOrderValue,
      retentionScore: signals.retentionScore,
      lifetimeValue,
      predictedLifetimeValue,
      validationStatus: "pending",
    });

    const validation = this.validationEngine.validateClvRecord(record, config);
    if (validation.decision === "fail") {
      return { record: null, validation, error: validation.errors.join("; ") };
    }

    record = {
      ...record,
      validationStatus: validation.decision === "pass" ? "passed" : "partial",
    };
    return { record, validation, error: null };
  }

  connectClvEngine(
    _input: ConnectClvEngineInput,
    config: CustomerLifetimeValueEngineConfiguration,
  ): ClvRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState: configValidation.decision === "fail" ? "failed" : "active",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      identityEngineConnected: this.isEngineConnected(this.identityEngine),
      crmFoundationConnected: this.isEngineConnected(this.crmFoundation),
      timelineEngineConnected: this.isEngineConnected(this.timelineEngine),
      revenueEngineConnected: this.isEngineConnected(this.revenueEngine),
      profitCalculationEngineConnected: this.isEngineConnected(this.profitCalculationEngine),
      loyaltyProgrammeEngineConnected: this.isEngineConnected(this.loyaltyProgrammeEngine),
      customerRiskEngineConnected: this.isEngineConnected(this.customerRiskEngine),
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

    appendClveLog({
      event: "engine_initialization",
      level: "info",
      details: `CLV Engine connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      clvRecords: [],
      insights: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  calculateCustomerLifetimeValue(
    input: CalculateCustomerLifetimeValueInput,
    config: CustomerLifetimeValueEngineConfiguration,
  ): ClvRunReport {
    return this.runAction("calculate_clv", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      const signals = this.gatherSignals(input.customerId);
      const built = this.buildClvRecordFromSignals(input.customerId, signals, config);
      if (!built.record) return this.emptyResult(built.validation, built.error);

      this.registry.storeRecord(built.record);
      appendClveLog({
        event: "clv_calculation",
        level: "info",
        details: `CLV calculated for ${input.customerId}: ${built.record.lifetimeValue}`,
      });

      return {
        clvRecords: [built.record],
        insights: [],
        failures: [],
        validation: built.validation,
        error: null,
      };
    });
  }

  trackCustomerRevenueContribution(
    input: TrackCustomerRevenueInput,
    config: CustomerLifetimeValueEngineConfiguration,
  ): ClvRunReport {
    return this.runAction("track_revenue", config, () =>
      this.trackPartial(input.customerId, config, (signals) => {
        appendClveLog({
          event: "customer_value_analysis",
          level: "info",
          details: `Revenue tracked for ${input.customerId}: ${signals.revenueContribution}`,
        });
        return signals;
      }),
    );
  }

  trackCustomerProfitability(
    input: TrackCustomerProfitabilityInput,
    config: CustomerLifetimeValueEngineConfiguration,
  ): ClvRunReport {
    return this.runAction("track_profitability", config, () =>
      this.trackPartial(input.customerId, config, (signals) => {
        const profit = this.profitabilityEngine.analyze([], signals.revenueContribution, config);
        signals.profitContribution = profit.profitContribution;
        appendClveLog({
          event: "customer_value_analysis",
          level: "info",
          details: `Profitability tracked for ${input.customerId}: ${profit.profitContribution}`,
        });
        return signals;
      }),
    );
  }

  trackCustomerRetention(
    input: TrackCustomerRetentionInput,
    config: CustomerLifetimeValueEngineConfiguration,
  ): ClvRunReport {
    return this.runAction("track_retention", config, () =>
      this.trackPartial(input.customerId, config, (signals) => {
        const retention = this.retentionEngine.analyze({
          timelineEventCount: signals.timelineEventCount,
          purchaseFrequency: signals.purchaseFrequency,
          loyaltyTier: signals.loyaltyTier,
          loyaltyPoints: signals.loyaltyPoints,
          riskScore: signals.riskScore,
          config,
        });
        signals.retentionScore = retention.retentionScore;
        appendClveLog({
          event: "customer_value_analysis",
          level: "info",
          details: `Retention tracked for ${input.customerId}: ${retention.retentionScore}`,
        });
        return signals;
      }),
    );
  }

  trackPurchaseFrequency(
    input: TrackPurchaseFrequencyInput,
    config: CustomerLifetimeValueEngineConfiguration,
  ): ClvRunReport {
    return this.runAction("track_purchase_frequency", config, () =>
      this.trackPartial(input.customerId, config, (signals) => signals),
    );
  }

  trackAverageOrderValue(
    input: TrackAverageOrderValueInput,
    config: CustomerLifetimeValueEngineConfiguration,
  ): ClvRunReport {
    return this.runAction("track_average_order_value", config, () =>
      this.trackPartial(input.customerId, config, (signals) => signals),
    );
  }

  predictFutureCustomerValue(
    input: PredictFutureCustomerValueInput,
    config: CustomerLifetimeValueEngineConfiguration,
  ): ClvRunReport {
    return this.runAction("predict_future_value", config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return this.emptyResult(validation, customer.error);
      }

      const signals = this.gatherSignals(input.customerId);
      const { lifetimeValue } = this.calculationEngine.calculate(signals, config);
      const { predictedLifetimeValue } = this.predictionEngine.predict({
        lifetimeValue,
        averageOrderValue: signals.averageOrderValue,
        purchaseFrequency: signals.purchaseFrequency,
        retentionScore: signals.retentionScore,
        config,
      });

      const existing = this.registry.listRecordsForCustomer(input.customerId).at(-1);
      let record: ClvRecord;
      if (existing) {
        record = {
          ...existing,
          predictedLifetimeValue,
          timestamp: new Date().toISOString(),
        };
      } else {
        const built = this.buildClvRecordFromSignals(input.customerId, signals, config);
        if (!built.record) return this.emptyResult(built.validation, built.error);
        record = { ...built.record, predictedLifetimeValue };
      }

      this.registry.storeRecord(record);
      const insight = this.metadataGenerator.buildInsight({
        customerId: input.customerId,
        clvRecordId: record.clvRecordId,
        insightType: "prediction",
        valueTier: "standard",
        message: `Predicted lifetime value: ${predictedLifetimeValue}`,
      });
      this.registry.storeInsight(insight);

      appendClveLog({
        event: "prediction_generation",
        level: "info",
        details: `Prediction for ${input.customerId}: ${predictedLifetimeValue}`,
      });

      const validation = this.validationEngine.validateClvRecord(record, config);
      return {
        clvRecords: [record],
        insights: [insight],
        failures: [],
        validation,
        error: null,
      };
    });
  }

  identifyHighValueCustomers(
    input: IdentifyHighValueCustomersInput,
    config: CustomerLifetimeValueEngineConfiguration,
  ): ClvRunReport {
    return this.runAction("identify_high_value", config, () => {
      const records = input.customerId
        ? this.registry.listRecordsForCustomer(input.customerId)
        : this.registry.listRecords();
      const insights: ClvInsight[] = [];

      for (const record of records) {
        if (record.lifetimeValue < config.highValueThreshold) continue;
        const insight = this.metadataGenerator.buildInsight({
          customerId: record.customerId,
          clvRecordId: record.clvRecordId,
          insightType: "high_value",
          valueTier: "high",
          message: `High-value customer: CLV ${record.lifetimeValue}`,
        });
        this.registry.storeInsight(insight);
        insights.push(insight);
      }

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      appendClveLog({
        event: "customer_value_analysis",
        level: "info",
        details: `Identified ${insights.length} high-value customer(s)`,
      });

      return {
        clvRecords: records.filter((r) => r.lifetimeValue >= config.highValueThreshold),
        insights,
        failures: [],
        validation,
        error: null,
      };
    });
  }

  identifyDecliningCustomerValue(
    input: IdentifyDecliningCustomerValueInput,
    config: CustomerLifetimeValueEngineConfiguration,
  ): ClvRunReport {
    return this.runAction("identify_declining_value", config, () => {
      const insights: ClvInsight[] = [];
      const declining: ClvRecord[] = [];
      const customerIds = input.customerId
        ? [input.customerId]
        : [...new Set(this.registry.listRecords().map((r) => r.customerId))];

      for (const customerId of customerIds) {
        const history = this.registry
          .listRecordsForCustomer(customerId)
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        if (history.length < 2) continue;

        const previous = history.at(-2)!;
        const current = history.at(-1)!;
        const dropPercent =
          previous.lifetimeValue > 0
            ? ((previous.lifetimeValue - current.lifetimeValue) / previous.lifetimeValue) * 100
            : 0;

        if (dropPercent < config.decliningValueDropPercent) continue;

        declining.push(current);
        const insight = this.metadataGenerator.buildInsight({
          customerId,
          clvRecordId: current.clvRecordId,
          insightType: "declining_value",
          valueTier: "declining",
          message: `Declining CLV: ${dropPercent.toFixed(1)}% drop`,
        });
        this.registry.storeInsight(insight);
        insights.push(insight);
      }

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        clvRecords: declining,
        insights,
        failures: [],
        validation,
        error: null,
      };
    });
  }

  detectClvFailures(
    input: DetectClvFailuresInput,
    config: CustomerLifetimeValueEngineConfiguration,
  ): ClvRunReport {
    return this.runAction("detect_failures", config, () => {
      const detected: ClvFailure[] = [];
      const records = input.clvRecordId
        ? [this.registry.getRecord(input.clvRecordId)].filter(Boolean)
        : this.registry.listRecords();

      for (const record of records as ClvRecord[]) {
        if (record.validationStatus === "failed") {
          detected.push(
            this.metadataGenerator.buildFailure({
              clvRecordId: record.clvRecordId,
              reason: "Validation failed on CLV record",
              severity: "high",
            }),
          );
        }
      }

      for (const failure of detected) this.registry.storeFailure(failure);

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      if (detected.length > 0) validation.decision = "partial";

      return {
        clvRecords: records as ClvRecord[],
        insights: [],
        failures: detected,
        validation,
        error: null,
      };
    });
  }

  reportClvStatus(config: CustomerLifetimeValueEngineConfiguration): ClvRunReport {
    return this.runAction("report_status", config, () => ({
      clvRecords: this.registry.listRecords(),
      insights: this.registry.listInsights(),
      failures: this.registry.listFailures(),
      validation: this.validator.validateEngineRecord(this.engineRecord!),
      error: null,
    }));
  }

  reportClvHealth(config: CustomerLifetimeValueEngineConfiguration): ClvRunReport {
    return this.runAction("report_health", config, () => {
      const records = this.registry.listRecords();
      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      validation.warnings.push(
        `Health snapshot: ${records.length} CLV records · ${this.registry.listInsights().length} insights`,
      );
      return {
        clvRecords: records.slice(-10),
        insights: this.registry.listInsights().slice(-5),
        failures: [],
        validation,
        error: null,
      };
    });
  }

  private trackPartial(
    customerId: string,
    config: CustomerLifetimeValueEngineConfiguration,
    mutate: (signals: CustomerFinancialSignals) => CustomerFinancialSignals,
  ) {
    const customer = this.resolveCustomer(customerId);
    if (!customer.valid) {
      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      validation.decision = "fail";
      validation.errors.push(customer.error ?? "Invalid customer");
      return this.emptyResult(validation, customer.error);
    }

    const signals = mutate(this.gatherSignals(customerId));
    const built = this.buildClvRecordFromSignals(customerId, signals, config);
    if (!built.record) return this.emptyResult(built.validation, built.error);

    this.registry.storeRecord(built.record);
    return {
      clvRecords: [built.record],
      insights: [],
      failures: [],
      validation: built.validation,
      error: null,
    };
  }

  private emptyResult(
    validation: ClvRunReport["validation"],
    error: string | null,
  ) {
    return {
      clvRecords: [] as ClvRecord[],
      insights: [] as ClvInsight[],
      failures: [] as ClvFailure[],
      validation,
      error,
    };
  }

  private runAction(
    action: ClvRunReport["action"],
    config: CustomerLifetimeValueEngineConfiguration,
    fn: () => {
      clvRecords: ClvRecord[];
      insights: ClvInsight[];
      failures: ClvFailure[];
      validation: ClvRunReport["validation"];
      error: string | null;
    },
  ): ClvRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("CLV Engine not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      clvRecords: result.clvRecords,
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
