/** R3-07 — Cash flow forecast engine. */

import { appendCfLog } from "./cf-logging.js";
import type { CashFlowMonitorConfiguration } from "./configuration.js";
import type { CashFlowDataSource } from "./cash-flow-data-source.js";
import type { CashFlowMetadataGenerator } from "./cash-flow-metadata-generator.js";
import type { LiquidityMonitoringEngine } from "./liquidity-monitoring-engine.js";
import type { CashFlowForecast, ForecastCashAvailabilityInput } from "./types.js";

export class CashFlowForecastEngine {
  constructor(
    private readonly dataSource: CashFlowDataSource,
    private readonly metadataGenerator: CashFlowMetadataGenerator,
    private readonly liquidityEngine: LiquidityMonitoringEngine,
  ) {}

  forecast(
    input: ForecastCashAvailabilityInput,
    config: CashFlowMonitorConfiguration,
  ): CashFlowForecast {
    if (!config.forecastRulesEnabled) {
      throw new Error("Forecast rules disabled");
    }

    const horizonDays = input.horizonDays ?? config.forecastHorizonDays;
    const snapshot = this.dataSource.snapshot({
      bankingReference: input.bankingReference,
    });

    const dailyNet = snapshot.operatingCashFlow / Math.max(1, horizonDays);
    const projectedNetCashFlow = dailyNet * horizonDays;
    const projectedClosingBalance = snapshot.openingBalance + projectedNetCashFlow;
    const liquidityStatus = this.liquidityEngine.assess(projectedClosingBalance, config);

    const forecast = this.metadataGenerator.buildForecast({
      horizonDays,
      projectedClosingBalance,
      projectedNetCashFlow,
      liquidityStatus,
    });

    appendCfLog({
      event: "forecast_generation",
      level: "info",
      details: `Forecast ${horizonDays}d · projected balance ${projectedClosingBalance}`,
    });

    return forecast;
  }
}
