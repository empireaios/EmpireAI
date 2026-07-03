/**
 * G2-05 — Payment contract validation.
 */

import type { CommercePaymentRow } from "../../../../registry/types/commerce-registry-types.js";
import {
  PAYMENT_INTEGRATION_VERSION,
  paymentAdapterContractSchema,
  paymentIntegrationConfigurationSchema,
  type PaymentAdapterContract,
  type PaymentIntegrationConfiguration,
} from "../contracts/payment-integration-types.js";

export class PaymentContractValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentContractValidationError";
  }
}

export function parsePaymentIntegrationConfiguration(
  configuration: Record<string, unknown>,
): PaymentIntegrationConfiguration {
  const integration = configuration.integrationFramework;
  try {
    return paymentIntegrationConfigurationSchema.parse(integration);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new PaymentContractValidationError(
      `Invalid payment integration configuration: ${detail}`,
    );
  }
}

export function buildPaymentAdapterContract(
  row: CommercePaymentRow,
  supportedCurrencies: string[] = [],
  healthStatus: PaymentAdapterContract["healthStatus"] = "unknown",
  adapterStatus: PaymentAdapterContract["status"] = "validated",
): PaymentAdapterContract {
  const integration = parsePaymentIntegrationConfiguration(row.configuration);
  const currencies =
    supportedCurrencies.length > 0 ? supportedCurrencies : integration.supportedCurrencies;

  const contract = {
    providerId: row.id,
    providerName: row.name,
    version: row.version,
    status: adapterStatus,
    capabilities: row.capabilities,
    supportedCountries: row.supportedCountries,
    supportedCurrencies: currencies,
    authenticationMethod: integration.authenticationMethod,
    paymentMethods: integration.paymentMethods,
    refundSupport: integration.refundSupport,
    payoutSupport: integration.payoutSupport,
    webhookSupport: integration.webhookSupport,
    securityFeatures: integration.securityFeatures,
    healthStatus,
    pluginCompatibility: {
      allowPluginRegistration: row.pluginSupport.allowPluginRegistration,
      pluginKind: row.pluginSupport.pluginKind,
      pluginId: row.pluginSupport.pluginId,
    },
    domainContracts: integration.domainContracts,
    registryRowRef: row.id,
    policyRef: row.policyRef,
    providerRef: row.providerRef,
    discoverySource: "RegistryLoader:REG-PAYMENT" as const,
  };

  try {
    return paymentAdapterContractSchema.parse(contract);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new PaymentContractValidationError(
      `Invalid payment adapter contract for ${row.id}: ${detail}`,
    );
  }
}

export function validatePaymentAdapterContract(contract: unknown): PaymentAdapterContract {
  try {
    return paymentAdapterContractSchema.parse(contract);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new PaymentContractValidationError(`Malformed payment adapter contract: ${detail}`);
  }
}

export function assertUniquePaymentProviderIds(contracts: PaymentAdapterContract[]): void {
  const seen = new Set<string>();
  for (const contract of contracts) {
    if (seen.has(contract.providerId)) {
      throw new PaymentContractValidationError(
        `Duplicate payment provider id: ${contract.providerId}`,
      );
    }
    seen.add(contract.providerId);
  }
}
