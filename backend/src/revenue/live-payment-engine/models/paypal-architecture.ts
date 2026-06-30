import { z } from "zod";

/** PayPal integration architecture — blueprint only, not implemented (Mission 103). */
export type PayPalArchitectureBlueprint = {
  blueprintId: string;
  status: "ARCHITECTURE_ONLY";
  implementationPhase: "M104_OR_LATER";
  capabilities: {
    checkout: "PLANNED";
    paymentCapture: "PLANNED";
    refund: "PLANNED";
    webhook: "PLANNED";
    ledgerIntegration: "PLANNED";
  };
  requiredEnvVars: string[];
  webhookEvents: string[];
  oauthFlow: string;
  ledgerEventMapping: Record<string, string>;
  notes: string;
};

export const PAYPAL_ARCHITECTURE_BLUEPRINT: PayPalArchitectureBlueprint = {
  blueprintId: "paypal-arch-m103",
  status: "ARCHITECTURE_ONLY",
  implementationPhase: "M104_OR_LATER",
  capabilities: {
    checkout: "PLANNED",
    paymentCapture: "PLANNED",
    refund: "PLANNED",
    webhook: "PLANNED",
    ledgerIntegration: "PLANNED",
  },
  requiredEnvVars: [
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
    "PAYPAL_WEBHOOK_ID",
    "PAYPAL_MODE=sandbox|live",
  ],
  webhookEvents: [
    "CHECKOUT.ORDER.APPROVED",
    "PAYMENT.CAPTURE.COMPLETED",
    "PAYMENT.CAPTURE.REFUNDED",
  ],
  oauthFlow: "PayPal REST v2 OAuth2 client credentials → Orders API → Capture → webhook verification",
  ledgerEventMapping: {
    "PAYMENT.CAPTURE.COMPLETED": "sale",
    "PAYMENT.CAPTURE.REFUNDED": "refund",
    "PAYMENT.CAPTURE.DENIED": "chargeback",
  },
  notes:
    "PayPal is architecture-only in Mission 103. Stripe handles all live payments. PayPal implementation deferred to protect integration quality.",
};

export const paypalArchitectureSchema = z.object({
  blueprintId: z.string().min(1),
  status: z.literal("ARCHITECTURE_ONLY"),
  implementationPhase: z.literal("M104_OR_LATER"),
  capabilities: z.object({
    checkout: z.literal("PLANNED"),
    paymentCapture: z.literal("PLANNED"),
    refund: z.literal("PLANNED"),
    webhook: z.literal("PLANNED"),
    ledgerIntegration: z.literal("PLANNED"),
  }),
  requiredEnvVars: z.array(z.string()),
  webhookEvents: z.array(z.string()),
  oauthFlow: z.string(),
  ledgerEventMapping: z.record(z.string()),
  notes: z.string(),
});

export function validatePayPalArchitectureBlueprint(value: unknown): PayPalArchitectureBlueprint {
  return paypalArchitectureSchema.parse(value) as PayPalArchitectureBlueprint;
}
