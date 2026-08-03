/** X2-09 — Health Scoring Engine. */

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export class HealthScoringEngine {
  scoreCompany(input: {
    revenueIndex: number;
    profitabilityIndex: number;
    operationalEfficiencyIndex: number;
    customerPerformanceIndex: number;
    growthIndex: number;
    riskScore: number;
  }): {
    financialHealthScore: number;
    operationalHealthScore: number;
    customerHealthScore: number;
    growthHealthScore: number;
    operationalRiskScore: number;
    compositeHealthScore: number;
  } {
    const financialHealthScore = clamp(
      (input.revenueIndex + input.profitabilityIndex) / 2,
    );
    const operationalHealthScore = clamp(input.operationalEfficiencyIndex);
    const customerHealthScore = clamp(input.customerPerformanceIndex);
    const growthHealthScore = clamp(input.growthIndex);
    const operationalRiskScore = clamp(input.riskScore);
    const riskInverted = 100 - operationalRiskScore;
    const compositeHealthScore = clamp(
      financialHealthScore * 0.25 +
        operationalHealthScore * 0.25 +
        customerHealthScore * 0.2 +
        growthHealthScore * 0.2 +
        riskInverted * 0.1,
    );
    return {
      financialHealthScore,
      operationalHealthScore,
      customerHealthScore,
      growthHealthScore,
      operationalRiskScore,
      compositeHealthScore,
    };
  }
}
