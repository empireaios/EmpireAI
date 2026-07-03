/**
 * G2-05 — Payment domain contract builder from registry-backed adapter contracts.
 */

import type { CommercePaymentRow } from "../../../../registry/types/commerce-registry-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { PaymentDomainContractBundle } from "../contracts/payment-domain-contracts.js";
import {
  buildPaymentAdapterContract,
  parsePaymentIntegrationConfiguration,
} from "../validation/payment-contract-validator.js";
import {
  resolveCurrenciesForPayment,
  resolvePolicyForPayment,
} from "../registry/payment-registry-resolver.js";

export function buildPaymentDomainContractBundle(
  context: RegistryLoaderContext,
  payment: CommercePaymentRow,
): PaymentDomainContractBundle {
  const currencies = resolveCurrenciesForPayment(context, payment);
  const contract = buildPaymentAdapterContract(payment, currencies);
  const integration = parsePaymentIntegrationConfiguration(payment.configuration);
  const policy = resolvePolicyForPayment(context, payment);

  return {
    authentication: {
      contractKind: "authentication",
      contractVersion: integration.domainContracts.authentication.contractVersion,
      authenticationMethod: integration.authenticationMethod,
      securityFeatures: contract.securityFeatures,
      credentialIsolated: true,
      pillowGoverned: true,
    },
    paymentIntent: {
      contractKind: "payment_intent",
      contractVersion: integration.domainContracts.payment_intent.contractVersion,
      supportedMethods: contract.paymentMethods,
      tokenisationRequired: contract.securityFeatures.includes("tokenisation"),
    },
    authorisation: {
      contractKind: "authorisation",
      contractVersion: integration.domainContracts.authorisation.contractVersion,
      idempotencyRequired: true,
      permissionIsolated: true,
    },
    capture: {
      contractKind: "capture",
      contractVersion: integration.domainContracts.capture.contractVersion,
      partialCaptureSupported: contract.capabilities.includes("capture"),
    },
    refund: {
      contractKind: "refund",
      contractVersion: integration.domainContracts.refund.contractVersion,
      refundSupported: integration.refundSupport.supported,
      policyRef: integration.refundSupport.policyRef ?? policy?.id ?? null,
    },
    payout: {
      contractKind: "payout",
      contractVersion: integration.domainContracts.payout.contractVersion,
      payoutSupported: integration.payoutSupport.supported,
      policyRef: integration.payoutSupport.policyRef ?? policy?.id ?? null,
    },
    webhook: {
      contractKind: "webhook",
      contractVersion: integration.domainContracts.webhook.contractVersion,
      webhookSupported: integration.webhookSupport.supported,
      verificationRequired: contract.securityFeatures.includes("webhook_verification"),
    },
  };
}
