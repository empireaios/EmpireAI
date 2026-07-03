/**
 * G2-06 — Pillow governance for carrier trust, shipping permissions, isolation, and policy.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  LogisticsPluginManifest,
  LogisticsShipmentLifecyclePhase,
} from "../contracts/logistics-integration-types.js";
import { buildLogisticsAdapterContract } from "../validation/logistics-contract-validator.js";
import {
  resolveLogisticsRowById,
  resolvePolicyForLogistics,
} from "../registry/logistics-registry-resolver.js";

export type LogisticsPillowGovernanceContext = RegistryLoaderContext & {
  actorId: string;
  providerId: string;
  operation:
    | "discover"
    | "validate"
    | "register"
    | "authenticate"
    | "create_shipment"
    | "generate_tracking"
    | "track_shipment"
    | "update_delivery_status"
    | "process_return"
    | "archive_shipment";
  lifecyclePhase?: LogisticsShipmentLifecyclePhase;
  pillowGovernance: true;
};

export type LogisticsPillowGovernanceResult = {
  allowed: boolean;
  reason: string;
  trustVerified: boolean;
  policyCompliant: boolean;
  workspaceIsolated: boolean;
  shippingAuthorized: boolean;
  eklsGoverned: boolean;
};

export function validateLogisticsPluginManifestStructure(
  manifest: LogisticsPluginManifest,
): LogisticsPillowGovernanceResult {
  if (!manifest.pillowGovernance) {
    return deny("Logistics plugins require pillowGovernance: true");
  }
  if (!manifest.pluginId?.trim() || !manifest.version?.trim()) {
    return deny("Logistics plugin manifest requires pluginId and version");
  }
  if (!manifest.logisticsRegistryRowId?.trim()) {
    return deny("Logistics plugin manifest requires logisticsRegistryRowId");
  }
  if (manifest.shippingServices.length === 0) {
    return deny("Logistics plugin manifest requires at least one shipping service");
  }
  return {
    allowed: true,
    reason: "Logistics plugin manifest structure valid",
    trustVerified: true,
    policyCompliant: false,
    workspaceIsolated: false,
    shippingAuthorized: false,
    eklsGoverned: false,
  };
}

function deny(reason: string): LogisticsPillowGovernanceResult {
  return {
    allowed: false,
    reason,
    trustVerified: false,
    policyCompliant: false,
    workspaceIsolated: false,
    shippingAuthorized: false,
    eklsGoverned: false,
  };
}

export function validateLogisticsPillowGovernance(
  context: LogisticsPillowGovernanceContext,
): LogisticsPillowGovernanceResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — pillowGovernance must be true");
  }
  if (!context.actorId?.trim()) {
    return deny("actorId is required for logistics governance audit");
  }
  if (!context.workspaceId?.trim()) {
    return deny("workspaceId is required for logistics workspace isolation");
  }

  const logistics = resolveLogisticsRowById(context, context.providerId);
  if (!logistics) {
    return deny(`Logistics registry row not found: ${context.providerId}`);
  }

  const policy = resolvePolicyForLogistics(context, logistics);
  const policyCompliant =
    !policy || policy.status === "VALIDATED" || policy.status === "PUBLISHED";
  if (!policyCompliant) {
    return {
      allowed: false,
      reason: "Logistics policy compliance check failed",
      trustVerified: true,
      policyCompliant: false,
      workspaceIsolated: true,
      shippingAuthorized: false,
      eklsGoverned: false,
    };
  }

  const contract = buildLogisticsAdapterContract(logistics);
  const shippingAuthorized = contract.shippingServices.some((service) => service.supported);
  if (!shippingAuthorized && context.operation === "create_shipment") {
    return {
      allowed: false,
      reason: "No supported shipping services for shipment creation",
      trustVerified: true,
      policyCompliant: true,
      workspaceIsolated: true,
      shippingAuthorized: false,
      eklsGoverned: false,
    };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      companyId: context.companyId,
      consumerChannel: "infrastructure-commerce",
      operation: "retrieve",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      trustVerified: true,
      policyCompliant: true,
      workspaceIsolated: false,
      shippingAuthorized: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Logistics carrier trust, permissions, isolation, and policy validation passed",
    trustVerified: true,
    policyCompliant: true,
    workspaceIsolated: true,
    shippingAuthorized: true,
    eklsGoverned: true,
  };
}
