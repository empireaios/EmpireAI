import crypto from "node:crypto";

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

const DEFAULT_TOLERANCE_SECONDS = 300;

function parseSignatureHeader(signatureHeader: string): { timestamp: string; signatures: string[] } {
  const elements = signatureHeader.split(",").reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split("=");
    if (!key || !value) {
      return acc;
    }
    const trimmedKey = key.trim();
    if (!acc[trimmedKey]) {
      acc[trimmedKey] = [];
    }
    acc[trimmedKey]!.push(value.trim());
    return acc;
  }, {});

  const timestamp = elements.t?.[0];
  const signatures = elements.v1 ?? [];
  if (!timestamp || signatures.length === 0) {
    throw new Error("Invalid Stripe-Signature header");
  }

  return { timestamp, signatures };
}

function verifyTimestamp(timestamp: string, toleranceSeconds: number): void {
  const timestampSeconds = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(timestampSeconds)) {
    throw new Error("Invalid Stripe-Signature timestamp");
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds);
  if (ageSeconds > toleranceSeconds) {
    throw new Error("Stripe webhook timestamp outside tolerance window");
  }
}

/** Verifies Stripe webhook signature per Stripe docs (HMAC + timestamp tolerance). */
export function verifyStripeWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  webhookSecret: string,
  toleranceSeconds = DEFAULT_TOLERANCE_SECONDS,
): StripeWebhookEvent {
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  if (!signatureHeader) {
    throw new Error("Missing Stripe-Signature header");
  }

  const { timestamp, signatures } = parseSignatureHeader(signatureHeader);
  verifyTimestamp(timestamp, toleranceSeconds);

  const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  const matched = signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature, "hex");
    return (
      signatureBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    );
  });

  if (!matched) {
    throw new Error("Stripe webhook signature verification failed");
  }

  return JSON.parse(rawBody.toString("utf8")) as StripeWebhookEvent;
}

/** Builds a Stripe-Signature header for proof/tests (does not expose secrets). */
export function buildStripeWebhookSignatureHeader(
  rawBody: string,
  webhookSecret: string,
  timestamp = Math.floor(Date.now() / 1000),
): string {
  const signedPayload = `${timestamp}.${rawBody}`;
  const signature = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");
  return `t=${timestamp},v1=${signature}`;
}
