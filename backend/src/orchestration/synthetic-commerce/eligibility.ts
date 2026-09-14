import {
  ELIGIBILITY_HARD_STOPS,
  type EligibilityHardStop,
  type EligibilityRiskFilter,
  type SyntheticProduct,
  SYNTHETIC_MARKETPLACE,
} from "./types.js";

export type EligibilitySignals = {
  policyBlocked?: boolean;
  ipBlocked?: boolean;
  approvalPending?: boolean;
  stockAvailable?: boolean;
  qualityAcceptable?: boolean;
  deliveryAcceptable?: boolean;
  economicsViable?: boolean;
};

const STOP_LABEL: Record<EligibilityHardStop, string> = {
  policy: "policy hard stop",
  ip: "IP / brand hard stop",
  approval: "approval hard stop",
  stock: "stock hard stop",
  quality: "quality hard stop",
  delivery: "delivery hard stop",
  economic: "economic hard stop",
};

/**
 * Deterministic eligibility / risk filter.
 * Any hard stop true ⇒ not eligible.
 */
export function evaluateEligibilityRiskFilter(
  productId: string,
  signals: EligibilitySignals,
): EligibilityRiskFilter {
  const hardStops: Record<EligibilityHardStop, boolean> = {
    policy: signals.policyBlocked === true,
    ip: signals.ipBlocked === true,
    approval: signals.approvalPending === true,
    stock: signals.stockAvailable === false,
    quality: signals.qualityAcceptable === false,
    delivery: signals.deliveryAcceptable === false,
    economic: signals.economicsViable === false,
  };

  const reasons: string[] = [];
  for (const stop of ELIGIBILITY_HARD_STOPS) {
    if (hardStops[stop]) reasons.push(STOP_LABEL[stop]);
  }

  return {
    productId,
    marketplace: SYNTHETIC_MARKETPLACE,
    synthetic: true,
    hardStops,
    eligible: reasons.length === 0,
    reasons,
  };
}

export function eligibilityFromProduct(
  product: SyntheticProduct,
  extras?: {
    stockAvailable?: boolean;
    qualityAcceptable?: boolean;
    deliveryAcceptable?: boolean;
    economicsViable?: boolean;
  },
): EligibilityRiskFilter {
  return evaluateEligibilityRiskFilter(product.productId, {
    policyBlocked: !product.amazonEligibility.policyClear || product.amazonEligibility.restrictedCategory,
    ipBlocked: !product.amazonEligibility.ipClear,
    approvalPending: product.amazonEligibility.approvalRequired,
    stockAvailable: extras?.stockAvailable ?? product.variants.some((v) => v.stockUnits > 0),
    qualityAcceptable: extras?.qualityAcceptable ?? true,
    deliveryAcceptable: extras?.deliveryAcceptable ?? product.deliveryDaysMax <= 12,
    economicsViable: extras?.economicsViable ?? true,
  });
}
