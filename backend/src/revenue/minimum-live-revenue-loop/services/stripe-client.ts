import crypto from "node:crypto";

import { loadRevenueLoopEnv, isStripeConfigured } from "../config/revenue-loop-env.js";

export type StripeCheckoutSession = {
  id: string;
  url: string;
  paymentIntentId: string | null;
  mock: boolean;
};

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

function encodeFormBody(params: Record<string, string | number>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
}

async function stripeRequest<T>(
  method: string,
  path: string,
  body?: Record<string, string | number>,
): Promise<T> {
  const config = loadRevenueLoopEnv();
  const secretKey = config.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
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

export type CreateCheckoutSessionInput = {
  storeSlug: string;
  storeId: string;
  workspaceId: string;
  companyId: string;
  productName: string;
  priceCents: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
};

/** Creates a Stripe Checkout Session or mock session when Stripe is not configured. */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<StripeCheckoutSession> {
  const config = loadRevenueLoopEnv();

  if (!isStripeConfigured(config)) {
    const mockId = `cs_mock_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    return {
      id: mockId,
      url: `${config.REVENUE_LOOP_STORE_BASE_URL}/store/${input.storeSlug}/checkout/mock?session_id=${mockId}`,
      paymentIntentId: `pi_mock_${mockId.slice(-12)}`,
      mock: true,
    };
  }

  const session = await stripeRequest<{
    id: string;
    url: string;
    payment_intent: string | { id: string } | null;
  }>("POST", "/checkout/sessions", {
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    "line_items[0][price_data][currency]": input.currency.toLowerCase(),
    "line_items[0][price_data][product_data][name]": input.productName,
    "line_items[0][price_data][unit_amount]": input.priceCents,
    "line_items[0][quantity]": 1,
    "metadata[storeId]": input.storeId,
    "metadata[storeSlug]": input.storeSlug,
    "metadata[workspaceId]": input.workspaceId,
    "metadata[companyId]": input.companyId,
    ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
  });

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  return {
    id: session.id,
    url: session.url,
    paymentIntentId,
    mock: false,
  };
}

/** Verifies Stripe webhook signature using raw body. */
export function verifyStripeWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
): StripeWebhookEvent {
  const config = loadRevenueLoopEnv();
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

/** Parses mock checkout completion for test/dev flows. */
export function buildMockCheckoutCompletedEvent(sessionId: string, metadata: Record<string, string>): StripeWebhookEvent {
  return {
    id: `evt_mock_${sessionId}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        payment_intent: `pi_mock_${sessionId.slice(-12)}`,
        customer_details: {
          email: metadata.customerEmail ?? "customer@example.com",
          name: metadata.customerName ?? "Grand King Customer",
        },
        shipping_details: {
          name: metadata.customerName ?? "Grand King Customer",
          address: {
            line1: metadata.addressLine1 ?? "123 Commerce Way",
            city: metadata.city ?? "Austin",
            state: metadata.state ?? "TX",
            postal_code: metadata.postalCode ?? "78701",
            country: metadata.countryCode ?? "US",
          },
        },
        amount_total: Number(metadata.amountTotal ?? 4999),
        currency: metadata.currency ?? "usd",
        metadata,
      },
    },
  };
}
