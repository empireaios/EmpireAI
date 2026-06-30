import type { RegisteredTool } from "../../../brain/types.js";
import { PAYPAL_ARCHITECTURE_BLUEPRINT } from "../models/paypal-architecture.js";
import {
  completeMockCheckout,
  completeMockPaymentIntent,
  createLiveCheckout,
  createLivePaymentIntent,
  getPaymentById,
  getRevenueSummary,
  listLivePayments,
  LivePaymentEngineBlockedError,
  processStripeWebhookEvent,
} from "../services/live-payment-engine-service.js";
import {
  buildMockCheckoutCompletedEvent,
  buildMockPaymentIntentSucceededEvent,
} from "../services/stripe-payment-service.js";

export const livePaymentTools: RegisteredTool[] = [
  {
    name: "live_payment.create_checkout",
    description: "Create Stripe Checkout session — real sale with ledger integration when webhook fires",
    module: "live-payments",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        storeId: { type: "string" },
        productName: { type: "string" },
        amountCents: { type: "number" },
        currency: { type: "string" },
        customerEmail: { type: "string" },
      },
      required: ["workspaceId", "companyId", "productName", "amountCents"],
    },
    handler: async (args) => {
      try {
        return createLiveCheckout({
          workspaceId: String(args.workspaceId),
          companyId: String(args.companyId),
          storeId: args.storeId ? String(args.storeId) : undefined,
          productName: String(args.productName),
          amountCents: Number(args.amountCents),
          currency: args.currency ? String(args.currency) : undefined,
          customerEmail: args.customerEmail ? String(args.customerEmail) : undefined,
        });
      } catch (error) {
        if (error instanceof LivePaymentEngineBlockedError) {
          return { blocked: true, error: error.message };
        }
        throw error;
      }
    },
  },
  {
    name: "live_payment.create_payment_intent",
    description: "Create Stripe PaymentIntent for direct card payment with ledger integration",
    module: "live-payments",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        storeId: { type: "string" },
        amountCents: { type: "number" },
        currency: { type: "string" },
        customerEmail: { type: "string" },
        description: { type: "string" },
      },
      required: ["workspaceId", "companyId", "amountCents"],
    },
    handler: async (args) => {
      try {
        return createLivePaymentIntent({
          workspaceId: String(args.workspaceId),
          companyId: String(args.companyId),
          storeId: args.storeId ? String(args.storeId) : undefined,
          amountCents: Number(args.amountCents),
          currency: args.currency ? String(args.currency) : undefined,
          customerEmail: args.customerEmail ? String(args.customerEmail) : undefined,
          description: args.description ? String(args.description) : undefined,
        });
      } catch (error) {
        if (error instanceof LivePaymentEngineBlockedError) {
          return { blocked: true, error: error.message };
        }
        throw error;
      }
    },
  },
  {
    name: "live_payment.process_webhook",
    description: "Process a Stripe webhook event (mock or verified) with idempotency and ledger",
    module: "live-payments",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        eventType: { type: "string" },
        sessionId: { type: "string" },
        paymentIntentId: { type: "string" },
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        amountCents: { type: "number" },
        currency: { type: "string" },
      },
      required: ["eventType", "workspaceId", "companyId"],
    },
    handler: async (args) => {
      const eventType = String(args.eventType);
      const workspaceId = String(args.workspaceId);
      const companyId = String(args.companyId);
      const amountCents = Number(args.amountCents ?? 4999);
      const currency = args.currency ? String(args.currency) : "USD";

      let event;
      if (eventType === "checkout.session.completed") {
        event = buildMockCheckoutCompletedEvent(String(args.sessionId ?? `cs_mock_${Date.now()}`), {
          workspaceId,
          companyId,
          amountTotal: String(amountCents),
          currency: currency.toLowerCase(),
        });
      } else if (eventType === "payment_intent.succeeded") {
        event = buildMockPaymentIntentSucceededEvent(
          String(args.paymentIntentId ?? `pi_mock_${Date.now()}`),
          {
            workspaceId,
            companyId,
            amountTotal: String(amountCents),
            currency: currency.toLowerCase(),
          },
        );
      } else {
        return { processed: false, reason: `Unsupported event type: ${eventType}` };
      }

      return processStripeWebhookEvent(event);
    },
  },
  {
    name: "live_payment.complete_mock_checkout",
    description: "Complete a mock checkout session for local testing — records real ledger sale",
    module: "live-payments",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        amountCents: { type: "number" },
        currency: { type: "string" },
        productName: { type: "string" },
      },
      required: ["sessionId", "workspaceId", "companyId", "amountCents"],
    },
    handler: async (args) =>
      completeMockCheckout({
        sessionId: String(args.sessionId),
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        amountCents: Number(args.amountCents),
        currency: args.currency ? String(args.currency) : undefined,
        productName: args.productName ? String(args.productName) : undefined,
      }),
  },
  {
    name: "live_payment.complete_mock_payment_intent",
    description: "Complete a mock PaymentIntent for local testing — records real ledger sale",
    module: "live-payments",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        paymentIntentId: { type: "string" },
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        amountCents: { type: "number" },
        currency: { type: "string" },
      },
      required: ["paymentIntentId", "workspaceId", "companyId", "amountCents"],
    },
    handler: async (args) =>
      completeMockPaymentIntent({
        paymentIntentId: String(args.paymentIntentId),
        workspaceId: String(args.workspaceId),
        companyId: String(args.companyId),
        amountCents: Number(args.amountCents),
        currency: args.currency ? String(args.currency) : undefined,
      }),
  },
  {
    name: "live_payment.get_revenue",
    description: "Get real revenue summary from succeeded payments and financial ledger",
    module: "live-payments",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) =>
      getRevenueSummary(
        String(args.workspaceId),
        args.companyId ? String(args.companyId) : undefined,
      ),
  },
  {
    name: "live_payment.list_payments",
    description: "List live payment records for a workspace",
    module: "live-payments",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => ({
      payments: listLivePayments(
        String(args.workspaceId),
        args.companyId ? String(args.companyId) : undefined,
      ),
    }),
  },
  {
    name: "live_payment.get_payment",
    description: "Get a single live payment record by ID",
    module: "live-payments",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        paymentId: { type: "string" },
      },
      required: ["paymentId"],
    },
    handler: async (args) => ({
      payment: getPaymentById(String(args.paymentId)),
    }),
  },
  {
    name: "live_payment.get_paypal_architecture",
    description: "Returns PayPal integration architecture blueprint (not implemented in M103)",
    module: "live-payments",
    authorityLevel: "L0",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ blueprint: PAYPAL_ARCHITECTURE_BLUEPRINT }),
  },
];
