/** X3-19 — Enterprise Balance Engine (utilization / supplier / infrastructure). */

import type { SelfBalancingEnterpriseConfiguration } from "./configuration.js";
import type { SelfBalancingRecord, SelfBalancingInput } from "./types.js";
import {
  buildSelfBalancingRecord,
  computeSelfBalancingSignals,
} from "./structural-signals.js";

export class EnterpriseBalanceEngine {
  monitorEnterpriseResourceUtilization(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
    sourceAvailable = true,
  ): SelfBalancingRecord {
    if (!config.enterpriseResourceUtilizationMonitoringEnabled) {
      throw new Error("Enterprise resource utilization monitoring disabled");
    }
    const signals = computeSelfBalancingSignals(
      "enterprise_resource_utilization_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.balanceScore >= config.balanceScoreThreshold
        ? `Enterprise utilization balance score ${signals.balanceScore}% clears threshold ${config.balanceScoreThreshold} — structural signals only; policy-gated`
        : `Enterprise utilization balance score ${signals.balanceScore}% below threshold — structural signals only; never reallocate beyond approval policies`;
    return buildSelfBalancingRecord({
      ...signals,
      expectedImprovement: summary,
    });
  }

  monitorSupplierBalance(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
    sourceAvailable = true,
  ): SelfBalancingRecord {
    if (!config.supplierBalanceMonitoringEnabled) {
      throw new Error("Supplier balance monitoring disabled");
    }
    const signals = computeSelfBalancingSignals(
      "supplier_balance_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.balanceScore >= config.supplierBalanceThreshold
        ? `Supplier balance score ${signals.balanceScore}% above ${config.supplierBalanceThreshold} — structural signals only`
        : signals.expectedImprovement;
    return buildSelfBalancingRecord({
      ...signals,
      resourceCategory: "supplier",
      expectedImprovement: summary,
    });
  }

  monitorInfrastructureBalance(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
    sourceAvailable = true,
  ): SelfBalancingRecord {
    if (!config.infrastructureBalanceMonitoringEnabled) {
      throw new Error("Infrastructure balance monitoring disabled");
    }
    const signals = computeSelfBalancingSignals(
      "infrastructure_balance_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.balanceScore >= config.infrastructureBalanceThreshold
        ? `Infrastructure balance score ${signals.balanceScore}% above ${config.infrastructureBalanceThreshold} — structural signals only`
        : signals.expectedImprovement;
    return buildSelfBalancingRecord({
      ...signals,
      resourceCategory: "infrastructure",
      expectedImprovement: summary,
    });
  }

  detectResourceImbalances(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
    sourceAvailable = true,
  ): SelfBalancingRecord {
    if (!config.resourceImbalanceDetectionEnabled) {
      throw new Error("Resource imbalance detection disabled");
    }
    const signals = computeSelfBalancingSignals(
      "resource_imbalance_detection",
      input,
      config,
      sourceAvailable,
    );
    const gap = Math.abs(signals.recommendedAllocation - signals.currentAllocation);
    const summary =
      gap >= 15
        ? `Imbalance detected · allocation gap ${gap}% on ${signals.resourceCategory} — policy-gated structural recommendation only`
        : `No material imbalance — gap ${gap}% within structural bounds; never reallocate protected resources beyond approval policies`;
    return buildSelfBalancingRecord({
      ...signals,
      expectedImprovement: summary,
    });
  }

  optimizeEnterpriseEquilibrium(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
    sourceAvailable = true,
  ): SelfBalancingRecord {
    if (!config.enterpriseEquilibriumOptimizationEnabled) {
      throw new Error("Enterprise equilibrium optimization disabled");
    }
    const signals = computeSelfBalancingSignals(
      "enterprise_equilibrium_optimization",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.balanceScore >= config.highScoreThreshold
        ? `Equilibrium optimization score ${signals.balanceScore}% — structural recommendation toward allocation ${signals.recommendedAllocation}%; policy-gated`
        : signals.expectedImprovement;
    return buildSelfBalancingRecord({
      ...signals,
      expectedImprovement: summary,
    });
  }
}
