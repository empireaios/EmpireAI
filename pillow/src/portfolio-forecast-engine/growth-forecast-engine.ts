/** X2-14 — Growth Forecast Engine (company, customer, supplier). */

import type { PortfolioForecastEngineConfiguration } from "./configuration.js";
import type { ForecastPeriod } from "./types.js";

function periodFactor(period: ForecastPeriod): number {
  switch (period) {
    case "30d":
      return 0.25;
    case "90d":
      return 0.75;
    case "180d":
      return 1.5;
    case "365d":
      return 3;
  }
}

export class GrowthForecastEngine {
  forecastCompanyGrowth(input: {
    companyCount: number;
    forecastPeriod: ForecastPeriod;
    config: PortfolioForecastEngineConfiguration;
  }): { growthForecast: number; confidenceScore: number } {
    const factor = periodFactor(input.forecastPeriod);
    const growthForecast = Math.round(
      input.config.baselineCompanyGrowthRate * factor + Math.min(8, input.companyCount),
    );
    const confidenceScore = Math.min(
      90,
      Math.max(input.config.minimumConfidenceThreshold, 50 + input.companyCount * 3),
    );
    return { growthForecast, confidenceScore };
  }

  forecastCustomerGrowth(input: {
    companyCount: number;
    forecastPeriod: ForecastPeriod;
    config: PortfolioForecastEngineConfiguration;
    customerSignalPresent: boolean;
  }): { customerGrowthForecast: number; confidenceScore: number } {
    const factor = periodFactor(input.forecastPeriod);
    const base = input.customerSignalPresent ? 12 : 7;
    const customerGrowthForecast = Math.round(base * factor + input.companyCount * 1.5);
    const confidenceScore = Math.min(
      88,
      Math.max(
        input.config.minimumConfidenceThreshold,
        input.customerSignalPresent ? 68 : 48,
      ),
    );
    return { customerGrowthForecast, confidenceScore };
  }

  forecastSupplierCapacity(input: {
    companyCount: number;
    forecastPeriod: ForecastPeriod;
    config: PortfolioForecastEngineConfiguration;
    supplierSignalPresent: boolean;
  }): { supplierCapacityForecast: number; confidenceScore: number } {
    const factor = periodFactor(input.forecastPeriod);
    const base = input.supplierSignalPresent ? 10 : 6;
    const supplierCapacityForecast = Math.round(base * factor + input.companyCount);
    const confidenceScore = Math.min(
      86,
      Math.max(
        input.config.minimumConfidenceThreshold,
        input.supplierSignalPresent ? 66 : 46,
      ),
    );
    return { supplierCapacityForecast, confidenceScore };
  }
}
