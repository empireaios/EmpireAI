/**
 * G2-08 — Commerce orchestration domain contract builder.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { CommerceOrchestrationProfileRow } from "../contracts/commerce-orchestration-types.js";
import type { CommerceOrchestrationDomainContractBundle } from "../contracts/commerce-orchestration-domain-contracts.js";
import {
  buildCommerceOrchestrationContract,
  parseCommerceOrchestrationConfiguration,
} from "../validation/commerce-orchestration-contract-validator.js";

export function buildCommerceOrchestrationDomainContractBundle(
  context: RegistryLoaderContext,
  profile: CommerceOrchestrationProfileRow,
): CommerceOrchestrationDomainContractBundle {
  const contract = buildCommerceOrchestrationContract(profile);
  const integration = parseCommerceOrchestrationConfiguration(profile.configuration);

  const componentMap = Object.fromEntries(
    integration.participatingComponents.map((entry) => [entry.component, entry]),
  ) as Record<string, (typeof integration.participatingComponents)[0]>;

  function requireComponent(component: keyof typeof componentMap) {
    const ref = componentMap[component];
    if (!ref) {
      throw new Error(`Missing orchestration component ref: ${component}`);
    }
    return ref;
  }

  return {
    workflowCoordination: {
      contractKind: "workflow_coordination",
      contractVersion: integration.domainContracts.workflow_coordination.contractVersion,
      executionScope: integration.executionScope,
      businessAutomationReplaced: false,
    },
    marketplaceCoordination: {
      contractKind: "marketplace",
      contractVersion: integration.domainContracts.marketplace_coordination.contractVersion,
      componentRef: requireComponent("marketplace"),
      engineLogicEmbedded: false,
    },
    supplierCoordination: {
      contractKind: "supplier",
      contractVersion: integration.domainContracts.supplier_coordination.contractVersion,
      componentRef: requireComponent("supplier"),
      engineLogicEmbedded: false,
    },
    storefrontCoordination: {
      contractKind: "storefront",
      contractVersion: integration.domainContracts.storefront_coordination.contractVersion,
      componentRef: requireComponent("storefront"),
      engineLogicEmbedded: false,
    },
    paymentCoordination: {
      contractKind: "payment",
      contractVersion: integration.domainContracts.payment_coordination.contractVersion,
      componentRef: requireComponent("payment"),
      engineLogicEmbedded: false,
    },
    logisticsCoordination: {
      contractKind: "logistics",
      contractVersion: integration.domainContracts.logistics_coordination.contractVersion,
      componentRef: requireComponent("logistics"),
      engineLogicEmbedded: false,
    },
    analyticsCoordination: {
      contractKind: "analytics",
      contractVersion: integration.domainContracts.analytics_coordination.contractVersion,
      componentRef: requireComponent("analytics"),
      engineLogicEmbedded: false,
    },
    stateManagement: {
      contractKind: "state_management",
      contractVersion: integration.domainContracts.state_management.contractVersion,
      crossComponentState: true,
      correlationRequired: true,
    },
    healthCoordination: {
      contractKind: "health_coordination",
      contractVersion: integration.domainContracts.health_coordination.contractVersion,
      operationalHealthOnly: true,
    },
  };
}
