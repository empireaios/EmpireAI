/**
 * G2-08 — Commerce orchestration domain coordination contracts (framework only).
 */

import type {
  CommerceCoordinationCapability,
  CommerceComponentRef,
  CommerceExecutionScope,
  CommerceParticipatingComponent,
} from "./commerce-orchestration-types.js";

export type CommerceWorkflowCoordinationContract = {
  contractKind: "workflow_coordination";
  contractVersion: string;
  executionScope: CommerceExecutionScope;
  businessAutomationReplaced: false;
};

export type CommerceComponentCoordinationContract = {
  contractKind: CommerceParticipatingComponent;
  contractVersion: string;
  componentRef: CommerceComponentRef;
  engineLogicEmbedded: false;
};

export type CommerceStateManagementContract = {
  contractKind: "state_management";
  contractVersion: string;
  crossComponentState: true;
  correlationRequired: true;
};

export type CommerceHealthCoordinationContract = {
  contractKind: "health_coordination";
  contractVersion: string;
  operationalHealthOnly: true;
};

export type CommerceOrchestrationDomainContractBundle = {
  workflowCoordination: CommerceWorkflowCoordinationContract;
  marketplaceCoordination: CommerceComponentCoordinationContract;
  supplierCoordination: CommerceComponentCoordinationContract;
  storefrontCoordination: CommerceComponentCoordinationContract;
  paymentCoordination: CommerceComponentCoordinationContract;
  logisticsCoordination: CommerceComponentCoordinationContract;
  analyticsCoordination: CommerceComponentCoordinationContract;
  stateManagement: CommerceStateManagementContract;
  healthCoordination: CommerceHealthCoordinationContract;
};

export const COMMERCE_ORCHESTRATION_DOMAIN_KINDS: CommerceCoordinationCapability[] = [
  "workflow_coordination",
  "marketplace_coordination",
  "supplier_coordination",
  "storefront_coordination",
  "payment_coordination",
  "logistics_coordination",
  "analytics_coordination",
  "state_management",
  "health_coordination",
];

export function listCommerceOrchestrationDomainKinds(): readonly CommerceCoordinationCapability[] {
  return COMMERCE_ORCHESTRATION_DOMAIN_KINDS;
}
