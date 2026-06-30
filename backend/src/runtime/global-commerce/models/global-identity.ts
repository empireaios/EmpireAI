import { z } from "zod";

export const ConnectionStatusSchema = z.enum([
  "NOT_CONNECTED",
  "PENDING",
  "CONNECTED",
  "EXPIRED",
  "ERROR",
  "BLOCKED",
]);

export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;

export const KycStatusSchema = z.enum([
  "NOT_STARTED",
  "INFO_REQUIRED",
  "DOCUMENTS_REQUIRED",
  "PENDING_REVIEW",
  "VERIFIED",
  "REJECTED",
]);

export type KycStatus = z.infer<typeof KycStatusSchema>;

export const GlobalCommerceIdentitySchema = z.object({
  identityId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  accountType: z.enum(["grand_king", "founder"]),
  founderIdentity: z.object({
    displayName: z.string(),
    email: z.string().optional(),
  }),
  businessIdentity: z.object({
    businessId: z.string().optional(),
    legalName: z.string().optional(),
    countryCode: z.string().optional(),
  }),
  brandIdentity: z.object({
    brandId: z.string().optional(),
    brandName: z.string().optional(),
  }),
  countryReadiness: z.array(
    z.object({
      countryCode: z.string(),
      readinessScore: z.number().int().min(0).max(100),
      status: z.string(),
    }),
  ),
  marketplaceAccounts: z.array(
    z.object({
      providerId: z.string(),
      countryCode: z.string(),
      connectionStatus: ConnectionStatusSchema,
      credentialsRef: z.string().optional(),
      accountHealth: z.string(),
      humanActionsRequired: z.array(z.string()),
    }),
  ),
  paymentAccounts: z.array(
    z.object({
      providerId: z.string(),
      countryCode: z.string(),
      connectionStatus: ConnectionStatusSchema,
      credentialsRef: z.string().optional(),
    }),
  ),
  supplierAccounts: z.array(
    z.object({
      providerId: z.string(),
      connectionStatus: ConnectionStatusSchema,
      credentialsRef: z.string().optional(),
    }),
  ),
  logisticsAccounts: z.array(z.object({ providerId: z.string(), connectionStatus: ConnectionStatusSchema })),
  advertisingAccounts: z.array(z.object({ providerId: z.string(), connectionStatus: ConnectionStatusSchema })),
  kycStatus: KycStatusSchema,
  termsAccepted: z.boolean(),
  documentsRequired: z.array(z.string()),
  humanActionsRequired: z.array(z.string()),
  updatedAt: z.string(),
});

export type GlobalCommerceIdentity = z.infer<typeof GlobalCommerceIdentitySchema>;
