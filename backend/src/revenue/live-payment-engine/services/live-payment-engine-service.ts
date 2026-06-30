import { loadLivePaymentEnv, isStripeLiveConfigured } from "../config/live-payment-env.js";
import type { LivePaymentRecord, RevenueSummary } from "../models/live-payment-record.js";
import {
  createLivePaymentRecord,
  getLivePaymentRepository,
} from "../repositories/sqlite-live-payment-repository.js";
import { ingestCheckoutCompleted } from "../../minimum-live-revenue-loop/services/revenue-loop-service.js";
import {
  recordRefundInLedger,
  recordSaleInLedger,
  computeRevenueFromPayments,
  getLedgerRevenue,
} from "./ledger-integration-service.js";
import {
  buildMockCheckoutCompletedEvent,
  buildMockPaymentIntentSucceededEvent,
  createStripeCheckoutSession,
  createStripePaymentIntent,
  type StripeWebhookEvent,
} from "./stripe-payment-service.js";

export class LivePaymentEngineBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LivePaymentEngineBlockedError";
  }
}

export type CreateLiveCheckoutInput = {
  workspaceId: string;
  companyId: string;
  storeId?: string;
  productName: string;
  amountCents: number;
  currency?: string;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
};

export type CreateLivePaymentIntentInput = {
  workspaceId: string;
  companyId: string;
  storeId?: string;
  amountCents: number;
  currency?: string;
  customerEmail?: string;
  description?: string;
  metadata?: Record<string, string>;
};

function assertLivePaymentsAllowed(): void {
  const config = loadLivePaymentEnv();
  if (!config.LIVE_PAYMENT_ENABLED && isStripeLiveConfigured(config)) {
    throw new LivePaymentEngineBlockedError(
      "Live payments are disabled. Set LIVE_PAYMENT_ENABLED=true to process real Stripe charges.",
    );
  }
}

function extractMetadata(object: Record<string, unknown>): Record<string, string> {
  const raw = (object.metadata ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, String(value)]),
  );
}

function correlationForSession(sessionId: string): string {
  return sessionId;
}

function correlationForPaymentIntent(paymentIntentId: string): string {
  return paymentIntentId;
}

/** Creates a Stripe Checkout session and persists a pending payment record. */
export async function createLiveCheckout(input: CreateLiveCheckoutInput) {
  assertLivePaymentsAllowed();
  const config = loadLivePaymentEnv();
  const currency = (input.currency ?? "USD").toUpperCase();
  const baseUrl = config.LIVE_PAYMENT_STORE_BASE_URL;

  const session = await createStripeCheckoutSession({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    storeId: input.storeId,
    productName: input.productName,
    amountCents: input.amountCents,
    currency,
    successUrl: input.successUrl ?? `${baseUrl}/live-payments/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: input.cancelUrl ?? `${baseUrl}/live-payments/checkout/cancel`,
    customerEmail: input.customerEmail,
    metadata: input.metadata,
  });

  const payment = getLivePaymentRepository().savePayment(
    createLivePaymentRecord({
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      storeId: input.storeId ?? null,
      provider: "STRIPE",
      method: "CHECKOUT",
      status: "PENDING",
      amountCents: input.amountCents,
      currency,
      stripeSessionId: session.sessionId,
      stripePaymentIntentId: session.paymentIntentId,
      stripeChargeId: null,
      customerEmail: input.customerEmail ?? null,
      customerName: null,
      ledgerSaleEventId: null,
      ledgerFeeEventId: null,
      metadata: {
        productName: input.productName,
        ...input.metadata,
      },
      mock: session.mock,
    }),
  );

  return {
    payment,
    checkoutUrl: session.checkoutUrl,
    sessionId: session.sessionId,
    mock: session.mock,
  };
}

/** Creates a Stripe PaymentIntent and persists a pending payment record. */
export async function createLivePaymentIntent(input: CreateLivePaymentIntentInput) {
  assertLivePaymentsAllowed();
  const currency = (input.currency ?? "USD").toUpperCase();

  const intent = await createStripePaymentIntent({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    storeId: input.storeId,
    amountCents: input.amountCents,
    currency,
    customerEmail: input.customerEmail,
    description: input.description,
    metadata: input.metadata,
  });

  const payment = getLivePaymentRepository().savePayment(
    createLivePaymentRecord({
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      storeId: input.storeId ?? null,
      provider: "STRIPE",
      method: "PAYMENT_INTENT",
      status: "PENDING",
      amountCents: input.amountCents,
      currency,
      stripeSessionId: null,
      stripePaymentIntentId: intent.paymentIntentId,
      stripeChargeId: null,
      customerEmail: input.customerEmail ?? null,
      customerName: null,
      ledgerSaleEventId: null,
      ledgerFeeEventId: null,
      metadata: input.metadata ?? {},
      mock: intent.mock,
    }),
  );

  return {
    payment,
    paymentIntentId: intent.paymentIntentId,
    clientSecret: intent.clientSecret,
    status: intent.status,
    mock: intent.mock,
  };
}

async function finalizeSuccessfulPayment(input: {
  payment: LivePaymentRecord;
  amountCents: number;
  currency: string;
  correlationId: string;
  customerEmail?: string | null;
  customerName?: string | null;
  stripeChargeId?: string | null;
  description: string;
}): Promise<LivePaymentRecord> {
  const repository = getLivePaymentRepository();

  if (input.payment.status === "SUCCEEDED" && input.payment.ledgerSaleEventId) {
    return input.payment;
  }

  const ledger =
    input.payment.ledgerSaleEventId
      ? {
          saleEventId: input.payment.ledgerSaleEventId,
          feeEventId: input.payment.ledgerFeeEventId,
        }
      : recordSaleInLedger({
          workspaceId: input.payment.workspaceId,
          companyId: input.payment.companyId,
          amountCents: input.amountCents,
          currency: input.currency,
          correlationId: input.correlationId,
          description: input.description,
          metadata: {
            paymentId: input.payment.paymentId,
            provider: input.payment.provider,
            method: input.payment.method,
          },
        });

  return repository.savePayment({
    ...input.payment,
    status: "SUCCEEDED",
    amountCents: input.amountCents,
    currency: input.currency,
    customerEmail: input.customerEmail ?? input.payment.customerEmail,
    customerName: input.customerName ?? input.payment.customerName,
    stripeChargeId: input.stripeChargeId ?? input.payment.stripeChargeId,
    ledgerSaleEventId: ledger.saleEventId,
    ledgerFeeEventId: ledger.feeEventId,
  });
}

async function handleCheckoutSessionCompleted(
  event: StripeWebhookEvent,
): Promise<LivePaymentRecord> {
  const session = event.data.object;
  const sessionId = String(session.id ?? "");
  const repository = getLivePaymentRepository();
  const metadata = extractMetadata(session);
  const customerDetails = (session.customer_details ?? {}) as Record<string, unknown>;

  if (!metadata.workspaceId || !metadata.companyId) {
    throw new Error("Checkout session missing workspaceId/companyId metadata");
  }

  let payment =
    repository.getByStripeSession(sessionId) ??
    createLivePaymentRecord({
      workspaceId: metadata.workspaceId,
      companyId: metadata.companyId,
      storeId: metadata.storeId ?? null,
      provider: "STRIPE",
      method: "CHECKOUT",
      status: "PROCESSING",
      amountCents: Number(session.amount_total ?? 0),
      currency: String(session.currency ?? "usd").toUpperCase(),
      stripeSessionId: sessionId,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
      stripeChargeId: null,
      customerEmail: null,
      customerName: null,
      ledgerSaleEventId: null,
      ledgerFeeEventId: null,
      metadata,
      mock: sessionId.startsWith("cs_mock_"),
    });

  if (!repository.getByStripeSession(sessionId)) {
    payment = repository.savePayment(payment);
  }

  const amountCents = Number(session.amount_total ?? payment.amountCents);
  const currency = String(session.currency ?? payment.currency).toUpperCase();

  payment = await finalizeSuccessfulPayment({
    payment,
    amountCents,
    currency,
    correlationId: correlationForSession(sessionId),
    customerEmail: String(customerDetails.email ?? metadata.customerEmail ?? payment.customerEmail),
    customerName: String(customerDetails.name ?? metadata.customerName ?? payment.customerName),
    description: `Stripe Checkout payment ${sessionId}`,
  });

  repository.markStripeEventProcessed(event.id, payment.paymentId);

  if (metadata.storeId || metadata.storeSlug) {
    try {
      await ingestCheckoutCompleted({ event });
    } catch {
      // Fulfillment ingest is optional; payment and ledger are canonical in M103.
    }
  }

  return payment;
}

async function handlePaymentIntentSucceeded(
  event: StripeWebhookEvent,
): Promise<LivePaymentRecord> {
  const intent = event.data.object;
  const paymentIntentId = String(intent.id ?? "");
  const repository = getLivePaymentRepository();
  const metadata = extractMetadata(intent);

  if (!metadata.workspaceId || !metadata.companyId) {
    throw new Error("PaymentIntent missing workspaceId/companyId metadata");
  }

  let payment =
    repository.getByStripePaymentIntent(paymentIntentId) ??
    createLivePaymentRecord({
      workspaceId: metadata.workspaceId,
      companyId: metadata.companyId,
      storeId: metadata.storeId ?? null,
      provider: "STRIPE",
      method: "PAYMENT_INTENT",
      status: "PROCESSING",
      amountCents: Number(intent.amount ?? 0),
      currency: String(intent.currency ?? "usd").toUpperCase(),
      stripeSessionId: null,
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId:
        typeof intent.latest_charge === "string" ? intent.latest_charge : null,
      customerEmail: intent.receipt_email ? String(intent.receipt_email) : null,
      customerName: null,
      ledgerSaleEventId: null,
      ledgerFeeEventId: null,
      metadata,
      mock: paymentIntentId.startsWith("pi_mock_"),
    });

  if (!repository.getByStripePaymentIntent(paymentIntentId)) {
    payment = repository.savePayment(payment);
  }

  const amountCents = Number(intent.amount ?? payment.amountCents);
  const currency = String(intent.currency ?? payment.currency).toUpperCase();

  payment = await finalizeSuccessfulPayment({
    payment,
    amountCents,
    currency,
    correlationId: correlationForPaymentIntent(paymentIntentId),
    customerEmail: intent.receipt_email ? String(intent.receipt_email) : payment.customerEmail,
    stripeChargeId:
      typeof intent.latest_charge === "string"
        ? intent.latest_charge
        : payment.stripeChargeId,
    description: `Stripe PaymentIntent ${paymentIntentId}`,
  });

  repository.markStripeEventProcessed(event.id, payment.paymentId);
  return payment;
}

async function handlePaymentIntentFailed(event: StripeWebhookEvent): Promise<LivePaymentRecord> {
  const intent = event.data.object;
  const paymentIntentId = String(intent.id ?? "");
  const repository = getLivePaymentRepository();
  const existing = repository.getByStripePaymentIntent(paymentIntentId);

  if (!existing) {
    throw new Error(`No payment record for failed PaymentIntent ${paymentIntentId}`);
  }

  const payment = repository.savePayment({ ...existing, status: "FAILED" });
  repository.markStripeEventProcessed(event.id, payment.paymentId);
  return payment;
}

async function handleChargeRefunded(event: StripeWebhookEvent): Promise<LivePaymentRecord> {
  const charge = event.data.object;
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : null;
  const repository = getLivePaymentRepository();

  const chargeMetadata = (charge.metadata ?? {}) as Record<string, string>;
  const payment =
    (paymentIntentId ? repository.getByStripePaymentIntent(paymentIntentId) : null) ??
    repository.getPaymentById(chargeMetadata.paymentId ?? "");

  if (!payment || payment.status !== "SUCCEEDED") {
    throw new Error("Refund received for unknown or non-succeeded payment");
  }

  const amountCents = Number(charge.amount_refunded ?? payment.amountCents);
  recordRefundInLedger({
    workspaceId: payment.workspaceId,
    companyId: payment.companyId,
    amountCents,
    currency: payment.currency,
    correlationId: `${payment.paymentId}:refund`,
    description: `Stripe refund for payment ${payment.paymentId}`,
  });

  const updated = repository.savePayment({ ...payment, status: "REFUNDED" });
  repository.markStripeEventProcessed(event.id, updated.paymentId);
  return updated;
}

/** Processes a Stripe webhook event idempotently with ledger integration. */
export async function processStripeWebhookEvent(
  event: StripeWebhookEvent,
): Promise<{ payment: LivePaymentRecord | null; skipped: boolean }> {
  const repository = getLivePaymentRepository();

  if (repository.getByStripeEvent(event.id)) {
    return { payment: null, skipped: true };
  }

  switch (event.type) {
    case "checkout.session.completed":
      return { payment: await handleCheckoutSessionCompleted(event), skipped: false };
    case "payment_intent.succeeded":
      return { payment: await handlePaymentIntentSucceeded(event), skipped: false };
    case "payment_intent.payment_failed":
      return { payment: await handlePaymentIntentFailed(event), skipped: false };
    case "charge.refunded":
      return { payment: await handleChargeRefunded(event), skipped: false };
    default:
      return { payment: null, skipped: false };
  }
}

/** Simulates mock checkout completion for local testing without Stripe. */
export async function completeMockCheckout(input: {
  sessionId: string;
  workspaceId: string;
  companyId: string;
  amountCents: number;
  currency?: string;
  productName?: string;
  storeId?: string;
  customerEmail?: string;
}): Promise<LivePaymentRecord> {
  const event = buildMockCheckoutCompletedEvent(input.sessionId, {
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    storeId: input.storeId ?? "",
    amountTotal: String(input.amountCents),
    currency: (input.currency ?? "USD").toLowerCase(),
    customerEmail: input.customerEmail ?? "mock-customer@grandkings.account",
    customerName: "Mock Customer",
    productName: input.productName ?? "Mock Product",
  });

  const result = await processStripeWebhookEvent(event);
  if (!result.payment) {
    throw new Error("Mock checkout did not produce a payment record");
  }
  return result.payment;
}

/** Simulates mock PaymentIntent success for local testing. */
export async function completeMockPaymentIntent(input: {
  paymentIntentId: string;
  workspaceId: string;
  companyId: string;
  amountCents: number;
  currency?: string;
  customerEmail?: string;
}): Promise<LivePaymentRecord> {
  const event = buildMockPaymentIntentSucceededEvent(input.paymentIntentId, {
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    amountTotal: String(input.amountCents),
    currency: (input.currency ?? "USD").toLowerCase(),
    customerEmail: input.customerEmail ?? "mock-customer@grandkings.account",
  });

  const result = await processStripeWebhookEvent(event);
  if (!result.payment) {
    throw new Error("Mock PaymentIntent did not produce a payment record");
  }
  return result.payment;
}

export function getPaymentById(paymentId: string): LivePaymentRecord | null {
  return getLivePaymentRepository().getPaymentById(paymentId);
}

export function listLivePayments(workspaceId: string, companyId?: string): LivePaymentRecord[] {
  return getLivePaymentRepository().listPayments(workspaceId, companyId);
}

/** Returns real revenue from succeeded payments and ledger cross-check. */
export function getRevenueSummary(workspaceId: string, companyId?: string): RevenueSummary & {
  ledgerRevenueCents: number;
} {
  const payments = listLivePayments(workspaceId, companyId);
  const paymentSummary = computeRevenueFromPayments(payments);
  const ledger = getLedgerRevenue(workspaceId);

  return {
    workspaceId,
    totalRevenueCents: paymentSummary.totalRevenueCents,
    totalPayments: paymentSummary.totalPayments,
    succeededPayments: paymentSummary.succeededPayments,
    currency: paymentSummary.currency,
    ledgerSaleCount: paymentSummary.ledgerSaleCount,
    ledgerRevenueCents: ledger.ledgerRevenueCents,
  };
}
