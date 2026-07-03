/**
 * G2-05 — Universal payment integration contract types.
 * Framework-only — no live payment processing or provider-specific logic.
 */

import { z } from "zod";

export const PAYMENT_INTEGRATION_VERSION = "g2-05-v1" as const;

export const PAYMENT_INTEGRATION_LIFECYCLE = [
  "discover",
  "validate",
  "register",
  "authenticate",
  "create_payment_intent",
  "authorise",
  "capture",
  "refund",
  "payout",
  "reconcile",
  "monitor",
  "archive",
] as const;

export type PaymentIntegrationLifecyclePhase = (typeof PAYMENT_INTEGRATION_LIFECYCLE)[number];

export const PAYMENT_ADAPTER_STATUSES = [
  "draft",
  "validated",
  "registered",
  "authenticated",
  "ready",
  "degraded",
  "suspended",
  "archived",
] as const;

export type PaymentAdapterStatus = (typeof PAYMENT_ADAPTER_STATUSES)[number];

export const PAYMENT_HEALTH_STATUSES = [
  "unknown",
  "healthy",
  "degraded",
  "unhealthy",
  "offline",
] as const;

export type PaymentHealthStatus = (typeof PAYMENT_HEALTH_STATUSES)[number];

export const PAYMENT_AUTHENTICATION_METHODS = [
  "oauth2",
  "api_key",
  "signed_request",
  "certificate",
  "provider_native",
  "plugin_managed",
] as const;

export type PaymentAuthenticationMethod = (typeof PAYMENT_AUTHENTICATION_METHODS)[number];

export const PAYMENT_METHOD_KINDS = [
  "card",
  "digital_wallet",
  "bank_transfer",
  "bnpl",
  "cryptocurrency",
  "future_technology",
] as const;

export type PaymentMethodKind = (typeof PAYMENT_METHOD_KINDS)[number];

export const PAYMENT_DOMAIN_CAPABILITIES = [
  "authentication",
  "payment_intent",
  "authorisation",
  "capture",
  "refund",
  "payout",
  "webhook",
] as const;

export type PaymentDomainCapability = (typeof PAYMENT_DOMAIN_CAPABILITIES)[number];

export const PAYMENT_SECURITY_FEATURES = [
  "tokenisation",
  "webhook_verification",
  "provider_authentication",
  "permission_isolation",
  "credential_isolation",
  "future_vault",
] as const;

export type PaymentSecurityFeature = (typeof PAYMENT_SECURITY_FEATURES)[number];

export const PAYMENT_EKLS_OUTCOME_KINDS = [
  "payment_outcome",
  "refund_outcome",
  "settlement_history",
  "provider_reliability",
  "operational_observation",
] as const;

export type PaymentEklsOutcomeKind = (typeof PAYMENT_EKLS_OUTCOME_KINDS)[number];

const semverPattern = /^\d+\.\d+\.\d+$/;

export const paymentSupportSchema = z.object({
  supported: z.boolean(),
  policyRef: z.string().optional(),
});

export type PaymentSupportFlags = z.infer<typeof paymentSupportSchema>;

export const paymentDomainContractSchema = z.object({
  contractVersion: z.string().min(1),
  supported: z.boolean(),
  capabilityRef: z.string().optional(),
});

export type PaymentDomainContractRef = z.infer<typeof paymentDomainContractSchema>;

export const paymentPluginCompatibilitySchema = z.object({
  allowPluginRegistration: z.boolean(),
  pluginKind: z.literal("commerce_payment").optional(),
  pluginId: z.string().optional(),
  minPluginVersion: z.string().optional(),
});

export type PaymentPluginCompatibility = z.infer<typeof paymentPluginCompatibilitySchema>;

export const paymentIntegrationConfigurationSchema = z.object({
  schemaVersion: z.literal(PAYMENT_INTEGRATION_VERSION),
  authenticationMethod: z.enum(PAYMENT_AUTHENTICATION_METHODS),
  paymentMethods: z.array(z.enum(PAYMENT_METHOD_KINDS)).min(1),
  supportedCurrencies: z.array(z.string()).min(1),
  refundSupport: paymentSupportSchema,
  payoutSupport: paymentSupportSchema,
  webhookSupport: paymentSupportSchema,
  securityFeatures: z.array(z.enum(PAYMENT_SECURITY_FEATURES)).min(1),
  domainContracts: z.object({
    authentication: paymentDomainContractSchema,
    payment_intent: paymentDomainContractSchema,
    authorisation: paymentDomainContractSchema,
    capture: paymentDomainContractSchema,
    refund: paymentDomainContractSchema,
    payout: paymentDomainContractSchema,
    webhook: paymentDomainContractSchema,
  }),
});

export type PaymentIntegrationConfiguration = z.infer<typeof paymentIntegrationConfigurationSchema>;

export const paymentAdapterContractSchema = z.object({
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  version: z.string().regex(semverPattern, "version must be semver (e.g. 1.0.0)"),
  status: z.enum(PAYMENT_ADAPTER_STATUSES),
  capabilities: z.array(z.string()).min(1),
  supportedCountries: z.array(z.string()).min(1),
  supportedCurrencies: z.array(z.string()).min(1),
  authenticationMethod: z.enum(PAYMENT_AUTHENTICATION_METHODS),
  paymentMethods: z.array(z.enum(PAYMENT_METHOD_KINDS)).min(1),
  refundSupport: paymentSupportSchema,
  payoutSupport: paymentSupportSchema,
  webhookSupport: paymentSupportSchema,
  securityFeatures: z.array(z.enum(PAYMENT_SECURITY_FEATURES)).min(1),
  healthStatus: z.enum(PAYMENT_HEALTH_STATUSES),
  pluginCompatibility: paymentPluginCompatibilitySchema,
  domainContracts: paymentIntegrationConfigurationSchema.shape.domainContracts,
  registryRowRef: z.string().min(1),
  policyRef: z.string().optional(),
  providerRef: z.string().optional(),
  discoverySource: z.literal("RegistryLoader:REG-PAYMENT"),
});

export type PaymentAdapterContract = z.infer<typeof paymentAdapterContractSchema>;

export type PaymentPluginManifest = {
  pluginId: string;
  pluginName: string;
  version: string;
  paymentRegistryRowId: string;
  paymentMethods: PaymentMethodKind[];
  securityFeatures: PaymentSecurityFeature[];
  pillowGovernance: true;
  extensions: Record<string, unknown>;
};

export type PaymentPluginRecord = PaymentPluginManifest & {
  lifecyclePhase: PaymentIntegrationLifecyclePhase;
  healthStatus: PaymentHealthStatus;
  registeredAt: string;
};

export type PaymentDiscoveryResult = {
  discoveredCount: number;
  providers: PaymentAdapterContract[];
  generatedAt: string;
  discoverySource: "RegistryLoader:REG-PAYMENT";
};

export type PaymentCapabilityResolution = {
  providerId: string;
  resolvedCapabilities: PaymentDomainCapability[];
  paymentMethods: PaymentMethodKind[];
  lifecyclePhase: PaymentIntegrationLifecyclePhase;
  policyCompliant: boolean;
  registryBacked: true;
};

export type PaymentSecurityValidationResult = {
  providerId: string;
  valid: boolean;
  tokenisationReady: boolean;
  webhookVerificationReady: boolean;
  credentialIsolated: boolean;
  reason: string;
};

export type PaymentLifecycleTransitionRequest = {
  providerId: string;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
  targetPhase: PaymentIntegrationLifecyclePhase;
};

export type PaymentLifecycleTransitionResult = {
  providerId: string;
  previousPhase: PaymentIntegrationLifecyclePhase;
  currentPhase: PaymentIntegrationLifecyclePhase;
  allowed: boolean;
  reason: string;
};

export type PaymentHealthSnapshot = {
  providerId: string;
  healthStatus: PaymentHealthStatus;
  lifecyclePhase: PaymentIntegrationLifecyclePhase;
  monitoredAt: string;
  registryWired: boolean;
  policyCompliant: boolean;
};

export type PaymentBrainCapabilityDescriptor = {
  providerId: string;
  capabilities: string[];
  domainCapabilities: PaymentDomainCapability[];
  paymentMethods: PaymentMethodKind[];
  discoverySource: "RegistryLoader:REG-PAYMENT";
};

export type PaymentEngineCapabilityEnvelope = {
  consumerId: string;
  providerId: string;
  capabilityIds: string[];
  domainCapabilities: PaymentDomainCapability[];
  discoverySource: "RegistryLoader:payment-engine-bridge";
};

export type PaymentEklsOutcomeRecord = {
  outcomeId: string;
  providerId: string;
  workspaceId: string;
  actorId: string;
  kind: PaymentEklsOutcomeKind;
  signalValue: number;
  signalUnit: "score" | "ratio" | "count" | "latency_ms";
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "infrastructure-commerce";
  /** Never stores credentials, tokens, or PAN data */
  credentialFree: true;
};

export type PaymentEklsOutcomeResult = {
  accepted: boolean;
  outcomeId?: string;
  reason: string;
  eklsGoverned: boolean;
};
