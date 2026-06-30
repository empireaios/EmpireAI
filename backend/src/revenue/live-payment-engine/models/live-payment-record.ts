import { z } from "zod";

export const PAYMENT_PROVIDERS = ["STRIPE", "PAYPAL"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_METHODS = ["CHECKOUT", "PAYMENT_INTENT"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Real payment record — persisted with ledger correlation. */
export type LivePaymentRecord = {
  paymentId: string;
  workspaceId: string;
  companyId: string;
  storeId: string | null;
  provider: PaymentProvider;
  method: PaymentMethod;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  ledgerSaleEventId: string | null;
  ledgerFeeEventId: string | null;
  metadata: Record<string, string>;
  mock: boolean;
  createdAt: string;
  updatedAt: string;
};

export const livePaymentRecordSchema = z.object({
  paymentId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  storeId: z.string().nullable(),
  provider: z.enum(PAYMENT_PROVIDERS),
  method: z.enum(PAYMENT_METHODS),
  status: z.enum(PAYMENT_STATUSES),
  amountCents: z.number().int().min(0),
  currency: z.string().length(3),
  stripeSessionId: z.string().nullable(),
  stripePaymentIntentId: z.string().nullable(),
  stripeChargeId: z.string().nullable(),
  customerEmail: z.string().nullable(),
  customerName: z.string().nullable(),
  ledgerSaleEventId: z.string().nullable(),
  ledgerFeeEventId: z.string().nullable(),
  metadata: z.record(z.string()),
  mock: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export function validateLivePaymentRecord(value: unknown): LivePaymentRecord {
  return livePaymentRecordSchema.parse(value);
}

export type RevenueSummary = {
  workspaceId: string;
  totalRevenueCents: number;
  totalPayments: number;
  succeededPayments: number;
  currency: string;
  ledgerSaleCount: number;
};
