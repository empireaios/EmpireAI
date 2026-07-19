/** R3-10 — Refund validation engine. */

import type { RefundEngineConfiguration } from "./configuration.js";
import type { RefundDataSource } from "./refund-data-source.js";
import type { RefundRegistry } from "./refund-registry.js";
import type { PaymentRecord } from "../payment-gateway-integration/types.js";

export type EligibilityResult = {
  eligible: boolean;
  errors: string[];
  warnings: string[];
  payment: PaymentRecord | null;
  maxRefundableAmount: number;
};

export class RefundValidationEngine {
  validateEligibility(
    paymentReference: string,
    refundAmount: number,
    config: RefundEngineConfiguration,
    dataSource: RefundDataSource,
    registry: RefundRegistry,
  ): EligibilityResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.eligibilityRulesEnabled) {
      warnings.push("Eligibility rules disabled");
    }

    const payment = dataSource.getPayment(paymentReference);
    if (!payment) {
      errors.push(`Payment record not found: ${paymentReference}`);
      return { eligible: false, errors, warnings, payment: null, maxRefundableAmount: 0 };
    }

    if (payment.paymentStatus !== "captured") {
      errors.push(`Payment not eligible — status: ${payment.paymentStatus}`);
    }

    const priorRefunds = registry.completedRefundTotal(paymentReference);
    const maxRefundableAmount = Math.max(0, payment.paymentAmount - priorRefunds);

    if (refundAmount <= 0) {
      errors.push("Refund amount must be positive");
    }
    if (refundAmount > maxRefundableAmount) {
      errors.push(`Refund amount exceeds refundable balance (${maxRefundableAmount})`);
    }

    const maxPartial = payment.paymentAmount * config.maxPartialRefundRatio;
    if (!config.partialRefundRulesEnabled && refundAmount < payment.paymentAmount) {
      errors.push("Partial refunds disabled");
    }
    if (refundAmount < payment.paymentAmount && refundAmount > maxPartial) {
      warnings.push("Partial refund exceeds configured ratio threshold");
    }

    return {
      eligible: errors.length === 0,
      errors,
      warnings,
      payment,
      maxRefundableAmount,
    };
  }
}
