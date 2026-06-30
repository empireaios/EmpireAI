import crypto from "node:crypto";

import { loadLivePaymentEnv, isStripeLiveConfigured } from "../config/live-payment-env.js";

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

export type StripeCheckoutResult = {
  sessionId: string;
  checkoutUrl: string;
  paymentIntentId: string | null;
  mock: boolean;
};

export type StripePaymentIntentResult = {
  paymentIntentId: string;
  clientSecret: string | null;
  status: string;
  mock: boolean;
};

const STRIPE_FEE_BPS = 290;
const STRIPE_FEE_FIXED_CENTS = 30;

export function estimateStripeFeeCents(amountCents: number): number {
  return Math.round((amountCents * STRIPE_FEE_BPS) / 10_000) + STRIPE_FEE_FIXED_CENTS;
}

function encodeFormBody(params: Record<string, string | number | boolean>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
}

async function stripeRequest<T>(
  path: string,
  body?: Record<string, string | number | boolean>,
): Promise<T> {
  const config = loadLivePaymentEnv();
  const secretKey = config.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? encodeFormBody(body) : undefined,
  });

  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Stripe API error (${response.status})`);
  }
  return payload;
}

export type CreateStripeCheckoutInput = {
  workspaceId: string;
  companyId: string;
  storeId?: string;
  productName: string;
  amountCents: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
};

/** Creates a Stripe Checkout Session for one-time payment. */
export async function createStripeCheckoutSession(
  input: CreateStripeCheckoutInput,
): Promise<StripeCheckoutResult> {
  const config = loadLivePaymentEnv();

  if (!isStripeLiveConfigured(config)) {
    const mockId = `cs_mock_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    return {
      sessionId: mockId,
      checkoutUrl: `${config.LIVE_PAYMENT_STORE_BASE_URL}/live-payments/checkout/mock?session_id=${mockId}`,
      paymentIntentId: `pi_mock_${mockId.slice(-12)}`,
      mock: true,
    };
  }

  const metadata = {
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    ...(input.storeId ? { storeId: input.storeId } : {}),
    ...input.metadata,
  };

  const body: Record<string, string | number | boolean> = {
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    "line_items[0][price_data][currency]": input.currency.toLowerCase(),
    "line_items[0][price_data][product_data][name]": input.productName,
    "line_items[0][price_data][unit_amount]": input.amountCents,
    "line_items[0][quantity]": 1,
  };

  for (const [key, value] of Object.entries(metadata)) {
    body[`metadata[${key}]`] = value;
  }
  if (input.customerEmail) {
    body.customer_email = input.customerEmail;
  }

  const session = await stripeRequest<{
    id: string;
    url: string;
    payment_intent: string | { id: string } | null;
  }>("/checkout/sessions", body);

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
    paymentIntentId,
    mock: false,
  };
}

export type CreateStripePaymentIntentInput = {
  workspaceId: string;
  companyId: string;
  storeId?: string;
  amountCents: number;
  currency: string;
  customerEmail?: string;
  description?: string;
  metadata?: Record<string, string>;
};

/** Creates a Stripe PaymentIntent for direct card payment flows. */
export async function createStripePaymentIntent(
  input: CreateStripePaymentIntentInput,
): Promise<StripePaymentIntentResult> {
  const config = loadLivePaymentEnv();

  if (!isStripeLiveConfigured(config)) {
    const mockId = `pi_mock_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    return {
      paymentIntentId: mockId,
      clientSecret: `pi_mock_secret_${mockId.slice(-12)}`,
      status: "requires_payment_method",
      mock: true,
    };
  }

  const metadata = {
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    ...(input.storeId ? { storeId: input.storeId } : {}),
    ...input.metadata,
  };

  const body: Record<string, string | number | boolean> = {
    amount: input.amountCents,
    currency: input.currency.toLowerCase(),
    automatic_payment_methods_enabled: true,
  };

  if (input.description) body.description = input.description;
  if (input.customerEmail) body.receipt_email = input.customerEmail;

  for (const [key, value] of Object.entries(metadata)) {
    body[`metadata[${key}]`] = value;
  }

  const intent = await stripeRequest<{
    id: string;
    client_secret: string | null;
    status: string;
  }>("/payment_intents", body);

  return {
    paymentIntentId: intent.id,
    clientSecret: intent.client_secret,
    status: intent.status,
    mock: false,
  };
}

/** Verifies Stripe webhook signature. */
export function verifyStripeWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
): StripeWebhookEvent {
  const config = loadLivePaymentEnv();
  const webhookSecret = config.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  if (!signatureHeader) {
    throw new Error("Missing Stripe-Signature header");
  }

  const elements = signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

  const timestamp = elements.t;
  const signature = elements.v1;
  if (!timestamp || !signature) {
    throw new Error("Invalid Stripe-Signature header");
  }

  const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new Error("Stripe webhook signature verification failed");
  }

  return JSON.parse(rawBody.toString("utf8")) as StripeWebhookEvent;
}

export function buildMockCheckoutCompletedEvent(
  sessionId: string,
  metadata: Record<string, string>,
): StripeWebhookEvent {
  return {
    id: `evt_mock_${sessionId}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        payment_intent: metadata.paymentIntentId ?? `pi_mock_${sessionId.slice(-12)}`,
        amount_total: Number(metadata.amountTotal ?? 4999),
        currency: metadata.currency ?? "usd",
        customer_details: {
          email: metadata.customerEmail ?? "customer@example.com",
          name: metadata.customerName ?? "Customer",
        },
        metadata,
      },
    },
  };
}

export function buildMockPaymentIntentSucceededEvent(
  paymentIntentId: string,
  metadata: Record<string, string>,
): StripeWebhookEvent {
  return {
    id: `evt_mock_pi_${paymentIntentId}`,
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: paymentIntentId,
        amount: Number(metadata.amountTotal ?? 4999),
        currency: metadata.currency ?? "usd",
        status: "succeeded",
        latest_charge: `ch_mock_${paymentIntentId.slice(-12)}`,
        receipt_email: metadata.customerEmail ?? "customer@example.com",
        metadata,
      },
    },
  };
}
