/** R3-07 — Cash flow monitoring core engine. */

import { appendCfLog } from "./cf-logging.js";
import type { CashFlowMonitorConfiguration } from "./configuration.js";
import type { CashFlowDataSource } from "./cash-flow-data-source.js";
import type { CashFlowMetadataGenerator } from "./cash-flow-metadata-generator.js";
import type { CashFlowValidationEngine } from "./cash-flow-validator.js";
import type { CashFlowRegistry } from "./cash-flow-registry.js";
import type { LiquidityMonitoringEngine } from "./liquidity-monitoring-engine.js";
import type {
  CashFlowRecord,
  MonitorCashFlowInput,
  MonitorInflowsInput,
  MonitorLiquidityInput,
  MonitorOutflowsInput,
} from "./types.js";

export class CashFlowMonitoringEngine {
  constructor(
    private readonly registry: CashFlowRegistry,
    private readonly metadataGenerator: CashFlowMetadataGenerator,
    private readonly validationEngine: CashFlowValidationEngine,
    private readonly liquidityEngine: LiquidityMonitoringEngine,
    private readonly dataSource: CashFlowDataSource,
  ) {}

  private buildRecord(
    snapshot: ReturnType<CashFlowDataSource["snapshot"]>,
    config: CashFlowMonitorConfiguration,
    dedupeKey: string,
    overrides?: { cashInflow?: number; cashOutflow?: number },
  ): { record: CashFlowRecord | null; error: string | null; warnings: string[] } {
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate cash flow monitoring event", warnings: [] };
    }

    const cashInflow = overrides?.cashInflow ?? snapshot.cashInflow;
    const cashOutflow = overrides?.cashOutflow ?? snapshot.cashOutflow;
    const netCashFlow = cashInflow - cashOutflow;
    const closingBalance = snapshot.openingBalance + netCashFlow;
    const liquidityStatus = this.liquidityEngine.assess(closingBalance, config);

    let record = this.metadataGenerator.buildCashFlowRecord({
      bankingReference: snapshot.bankingReference,
      revenueReference: snapshot.revenueReference,
      expenseReference: snapshot.expenseReference,
      openingBalance: snapshot.openingBalance,
      cashInflow,
      cashOutflow,
      closingBalance,
      netCashFlow,
      operatingCashFlow: snapshot.operatingCashFlow,
      liquidityStatus,
      validationStatus: "pending",
    });

    const validation = this.validationEngine.validateForMonitoring(record, config);
    if (validation.decision === "fail") {
      return { record: null, error: validation.errors.join("; "), warnings: snapshot.warnings };
    }

    record = { ...record, validationStatus: "passed" };
    this.registry.store(record, dedupeKey);

    appendCfLog({
      event: "cash_flow_calculation",
      level: "info",
      details: `Monitored cash flow ${record.cashFlowRecordId} · net ${record.netCashFlow}`,
    });

    return { record, error: null, warnings: snapshot.warnings };
  }

  monitorCashFlow(
    input: MonitorCashFlowInput,
    config: CashFlowMonitorConfiguration,
  ): { record: CashFlowRecord | null; error: string | null; warnings: string[] } {
    const snapshot = this.dataSource.snapshot({ bankingReference: input.bankingReference });
    const dedupeKey = `monitor:${input.bankingReference ?? "default"}:${snapshot.openingBalance}`;
    return this.buildRecord(snapshot, config, dedupeKey);
  }

  monitorInflows(
    input: MonitorInflowsInput,
    config: CashFlowMonitorConfiguration,
  ): { record: CashFlowRecord | null; error: string | null; warnings: string[] } {
    const snapshot = this.dataSource.snapshot({
      revenueReference: input.revenueReference,
      inflowsOnly: true,
    });
    const dedupeKey = `inflow:${input.revenueReference ?? "all"}`;
    return this.buildRecord(snapshot, config, dedupeKey, {
      cashInflow: snapshot.cashInflow,
      cashOutflow: 0,
    });
  }

  monitorOutflows(
    input: MonitorOutflowsInput,
    config: CashFlowMonitorConfiguration,
  ): { record: CashFlowRecord | null; error: string | null; warnings: string[] } {
    const snapshot = this.dataSource.snapshot({
      expenseReference: input.expenseReference,
      outflowsOnly: true,
    });
    const dedupeKey = `outflow:${input.expenseReference ?? "all"}`;
    return this.buildRecord(snapshot, config, dedupeKey, {
      cashInflow: 0,
      cashOutflow: snapshot.cashOutflow,
    });
  }

  monitorLiquidity(
    input: MonitorLiquidityInput,
    config: CashFlowMonitorConfiguration,
  ): { record: CashFlowRecord | null; error: string | null; warnings: string[] } {
    const snapshot = this.dataSource.snapshot({ bankingReference: input.bankingReference });
    const dedupeKey = `liquidity:${input.bankingReference ?? "default"}:${Date.now()}`;
    return this.buildRecord(snapshot, config, dedupeKey);
  }
}
