/** R3-02 — Payment processing engine. */

import { randomUUID } from "node:crypto";
import { appendPgLog } from "./pg-logging.js";
import type { GatewayRegistry } from "./gateway-registry.js";
import type { PaymentGatewayIntegrationConfiguration } from "./configuration.js";
import type { PaymentMetadataGenerator } from "./payment-metadata-generator.js";
import type { PaymentValidator } from "./payment-validator.js";
import type {
  CreatePaymentRequestInput,
  PaymentRecord,
  ProcessPaymentInput,
} from "./types.js";

export class PaymentProcessingEngine {
  constructor(
    private readonly registry: GatewayRegistry,
    private readonly metadataGenerator: PaymentMetadataGenerator,
    private readonly validator: PaymentValidator,
  ) {}

  createPaymentRequest(
    input: CreatePaymentRequestInput,
    config: PaymentGatewayIntegrationConfiguration,
  ): { record: PaymentRecord; validation: ReturnType<PaymentValidator["validatePaymentRequest"]> } {
    const validation = this.validator.validatePaymentRequest(input, config);
    if (validation.decision === "fail") {
      throw new Error(validation.errors.join("; ") || "Payment request validation failed");
    }

    const duplicate = this.registry.findByOrder(input.orderReference, input.paymentAmount);
    if (duplicate && duplicate.paymentStatus !== "failed" && duplicate.paymentStatus !== "cancelled") {
      validation.decision = "fail";
      validation.errors.push("Duplicate payment request for order reference");
      throw new Error("Duplicate payment request detected");
    }

    const record = this.metadataGenerator.buildPaymentRecord({
      customerReference: input.customerReference,
      orderReference: input.orderReference,
      paymentAmount: input.paymentAmount,
      currency: input.currency ?? config.defaultCurrency,
      paymentStatus: "pending",
      authorizationStatus: "none",
      validationStatus: "passed",
    });

    this.registry.storePayment(record);
    appendPgLog({
      event: "payment_request",
      level: "info",
      details: `Created payment ${record.paymentId} for order ${input.orderReference}`,
    });

    return { record, validation };
  }

  processAuthorization(
    input: ProcessPaymentInput,
    config: PaymentGatewayIntegrationConfiguration,
  ): PaymentRecord {
    if (!config.paymentProcessingRulesEnabled) {
      throw new Error("Payment processing rules disabled");
    }

    const payment = this.registry.getPayment(input.paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.paymentStatus !== "pending") {
      throw new Error(`Cannot authorize payment in status: ${payment.paymentStatus}`);
    }

    const updated =
      this.registry.updatePayment(input.paymentId, {
        paymentStatus: "authorized",
        authorizationStatus: "authorized",
        validationStatus: "passed",
        transactionId: payment.transactionId || `pg-txn-${randomUUID()}`,
      })!;

    appendPgLog({
      event: "payment_authorization",
      level: "info",
      details: `Authorized payment ${input.paymentId}`,
    });

    return updated;
  }

  processCapture(input: ProcessPaymentInput): PaymentRecord {
    const payment = this.registry.getPayment(input.paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.authorizationStatus !== "authorized") {
      throw new Error(`Cannot capture payment — authorization status: ${payment.authorizationStatus}`);
    }

    const updated =
      this.registry.updatePayment(input.paymentId, {
        paymentStatus: "captured",
        validationStatus: "passed",
      })!;

    appendPgLog({
      event: "payment_capture",
      level: "info",
      details: `Captured payment ${input.paymentId}`,
    });

    return updated;
  }

  processCancellation(input: ProcessPaymentInput): PaymentRecord {
    const payment = this.registry.getPayment(input.paymentId);
    if (!payment) throw new Error("Payment not found");
    if (payment.paymentStatus === "captured") {
      throw new Error("Cannot cancel captured payment");
    }

    const updated =
      this.registry.updatePayment(input.paymentId, {
        paymentStatus: "cancelled",
        authorizationStatus: payment.authorizationStatus === "authorized" ? "expired" : "none",
        validationStatus: "passed",
      })!;

    appendPgLog({
      event: "payment_cancellation",
      level: "info",
      details: `Cancelled payment ${input.paymentId}`,
    });

    return updated;
  }
}
