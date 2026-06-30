/**
 * Live Payment Engine module — Stripe Checkout, PaymentIntent, webhooks, ledger integration.
 */

import type { LivePaymentRecord, RevenueSummary } from "../models/live-payment-record.js";
import {
  createLiveCheckout,
  createLivePaymentIntent,
  getPaymentById,
  getRevenueSummary,
  listLivePayments,
  processStripeWebhookEvent,
} from "../services/live-payment-engine-service.js";
import { PAYPAL_ARCHITECTURE_BLUEPRINT } from "../models/paypal-architecture.js";

export const LIVE_PAYMENT_ENGINE_MODULE_ID = "live-payment-engine" as const;
export type LivePaymentEngineModuleId = typeof LIVE_PAYMENT_ENGINE_MODULE_ID;
export const LIVE_PAYMENT_ENGINE_VERSION = "0.1.0" as const;

export type LivePaymentEngineCapability =
  | "live-payment-engine.checkout"
  | "live-payment-engine.payment-intent"
  | "live-payment-engine.webhook"
  | "live-payment-engine.ledger"
  | "live-payment-engine.revenue";

export const LIVE_PAYMENT_ENGINE_CAPABILITIES: readonly LivePaymentEngineCapability[] = [
  "live-payment-engine.checkout",
  "live-payment-engine.payment-intent",
  "live-payment-engine.webhook",
  "live-payment-engine.ledger",
  "live-payment-engine.revenue",
] as const;

/** Orchestrates real Stripe payments with financial ledger integration. */
export class LivePaymentEngineModule {
  readonly moduleId = LIVE_PAYMENT_ENGINE_MODULE_ID;
  readonly version = LIVE_PAYMENT_ENGINE_VERSION;
  readonly capabilities = LIVE_PAYMENT_ENGINE_CAPABILITIES;
  readonly paypalArchitecture = PAYPAL_ARCHITECTURE_BLUEPRINT;

  createCheckout = createLiveCheckout;
  createPaymentIntent = createLivePaymentIntent;
  processWebhook = processStripeWebhookEvent;
  getPayment = getPaymentById;
  listPayments = listLivePayments;
  getRevenue = getRevenueSummary;
}

export function createLivePaymentEngineModule(): LivePaymentEngineModule {
  return new LivePaymentEngineModule();
}

export const livePaymentEngineModule = createLivePaymentEngineModule();

export type { LivePaymentRecord, RevenueSummary };
