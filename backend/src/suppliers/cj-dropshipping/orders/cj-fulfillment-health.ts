export const FULFILLMENT_HEALTH_TIERS = ["HEALTHY", "DEGRADED", "FAILED"] as const;

export type FulfillmentHealthTier = (typeof FULFILLMENT_HEALTH_TIERS)[number];

export type FulfillmentHealthMetrics = {
  submissionAttempts: number;
  submissionSuccesses: number;
  fulfillmentSuccesses: number;
  deliverySuccesses: number;
  failures: number;
};

export type FulfillmentHealthReport = {
  tier: FulfillmentHealthTier;
  metrics: FulfillmentHealthMetrics;
  submissionSuccessRate: number;
  fulfillmentSuccessRate: number;
  deliverySuccessRate: number;
  failureRate: number;
  evaluatedAt: string;
};

const globalMetrics: FulfillmentHealthMetrics = {
  submissionAttempts: 0,
  submissionSuccesses: 0,
  fulfillmentSuccesses: 0,
  deliverySuccesses: 0,
  failures: 0,
};

/** Resets fulfillment health telemetry (for tests). */
export function resetFulfillmentHealthTelemetry(): void {
  globalMetrics.submissionAttempts = 0;
  globalMetrics.submissionSuccesses = 0;
  globalMetrics.fulfillmentSuccesses = 0;
  globalMetrics.deliverySuccesses = 0;
  globalMetrics.failures = 0;
}

/** Records a submission attempt outcome. */
export function recordSubmissionAttempt(success: boolean): void {
  globalMetrics.submissionAttempts += 1;
  if (success) {
    globalMetrics.submissionSuccesses += 1;
  } else {
    globalMetrics.failures += 1;
  }
}

/** Records a fulfillment outcome (supplier acknowledged shipment). */
export function recordFulfillmentOutcome(success: boolean): void {
  if (success) {
    globalMetrics.fulfillmentSuccesses += 1;
  } else {
    globalMetrics.failures += 1;
  }
}

/** Records a delivery outcome. */
export function recordDeliveryOutcome(success: boolean): void {
  if (success) {
    globalMetrics.deliverySuccesses += 1;
  } else {
    globalMetrics.failures += 1;
  }
}

function safeRate(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 1;
  }
  return numerator / denominator;
}

function resolveTier(metrics: FulfillmentHealthMetrics): FulfillmentHealthTier {
  const submissionRate = safeRate(metrics.submissionSuccesses, metrics.submissionAttempts);
  const totalOutcomes =
    metrics.submissionSuccesses + metrics.fulfillmentSuccesses + metrics.deliverySuccesses + metrics.failures;
  const failureRate = totalOutcomes === 0 ? 0 : metrics.failures / totalOutcomes;

  if (failureRate >= 0.5 || (metrics.submissionAttempts > 0 && submissionRate < 0.5)) {
    return "FAILED";
  }

  if (failureRate >= 0.2 || (metrics.submissionAttempts > 0 && submissionRate < 0.8)) {
    return "DEGRADED";
  }

  return "HEALTHY";
}

/** Evaluates current fulfillment health tier from accumulated metrics. */
export function evaluateFulfillmentHealth(
  metrics: FulfillmentHealthMetrics = { ...globalMetrics },
): FulfillmentHealthReport {
  const submissionSuccessRate = safeRate(metrics.submissionSuccesses, metrics.submissionAttempts);
  const fulfillmentSuccessRate = safeRate(
    metrics.fulfillmentSuccesses,
    Math.max(metrics.submissionSuccesses, 1),
  );
  const deliverySuccessRate = safeRate(
    metrics.deliverySuccesses,
    Math.max(metrics.fulfillmentSuccesses, 1),
  );
  const totalOutcomes =
    metrics.submissionSuccesses + metrics.fulfillmentSuccesses + metrics.deliverySuccesses + metrics.failures;
  const failureRate = totalOutcomes === 0 ? 0 : metrics.failures / totalOutcomes;

  return {
    tier: resolveTier(metrics),
    metrics: { ...metrics },
    submissionSuccessRate,
    fulfillmentSuccessRate,
    deliverySuccessRate,
    failureRate,
    evaluatedAt: new Date().toISOString(),
  };
}
