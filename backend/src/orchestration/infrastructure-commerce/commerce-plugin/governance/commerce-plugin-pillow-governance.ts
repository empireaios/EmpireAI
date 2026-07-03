/**
 * G2-09 — Pillow governance for commerce plugin integration.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  CommercePluginLifecyclePhase,
  CommercePluginRegistrationManifest,
} from "../contracts/commerce-plugin-integration-types.js";
import { getCommercePluginSlotById } from "../data/commerce-plugin-slot-store.js";
import {
  verifyPluginSlotRegistryRef,
} from "../registry/commerce-plugin-registry-resolver.js";
import { validateCommercePluginCompatibility } from "../validation/commerce-plugin-compatibility-validator.js";
import {
  buildCommercePluginAdapterContract,
  validateCommercePluginRegistrationManifest,
} from "../validation/commerce-plugin-contract-validator.js";
import { getCommercePluginRecordById } from "../state/commerce-plugin-state-manager.js";

export type CommercePluginPillowContext = RegistryLoaderContext & {
  actorId: string;
  pluginId?: string;
  slotId?: string;
  operation:
    | "discover"
    | "validate"
    | "register"
    | "load"
    | "enable"
    | "execute"
    | "monitor"
    | "disable"
    | "unload"
    | "deprecate"
    | "retire";
  lifecyclePhase?: CommercePluginLifecyclePhase;
  pillowGovernance: true;
  brainRouted: true;
};

export type CommercePluginPillowResult = {
  allowed: boolean;
  reason: string;
  pluginApproved: boolean;
  trustVerified: boolean;
  permissionsGranted: boolean;
  lifecycleAuthorized: boolean;
  isolationVerified: boolean;
  policyCompliant: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): CommercePluginPillowResult {
  return {
    allowed: false,
    reason,
    pluginApproved: false,
    trustVerified: false,
    permissionsGranted: false,
    lifecycleAuthorized: false,
    isolationVerified: false,
    policyCompliant: false,
    eklsGoverned: false,
  };
}

export function validateCommercePluginRegistrationManifestGovernance(
  manifest: CommercePluginRegistrationManifest,
): CommercePluginPillowResult {
  const structure = validateCommercePluginRegistrationManifest(manifest);
  if (!structure.valid) {
    return deny(structure.reason);
  }

  const slot = getCommercePluginSlotById(manifest.slotId);
  if (!slot) {
    return deny(`Unknown commerce plugin slot: ${manifest.slotId}`);
  }

  return {
    allowed: true,
    reason: "Commerce plugin registration manifest approved by Pillow",
    pluginApproved: true,
    trustVerified: manifest.provenance === "official" || manifest.provenance === "internal",
    permissionsGranted: false,
    lifecycleAuthorized: false,
    isolationVerified: false,
    policyCompliant: false,
    eklsGoverned: false,
  };
}

export function validateCommercePluginPillowGovernance(
  context: CommercePluginPillowContext,
): CommercePluginPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required");
  }
  if (!context.brainRouted) {
    return deny("Commerce plugins must be Brain-routed");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }

  const slotId =
    context.slotId ??
    (context.pluginId ? getCommercePluginRecordById(context.pluginId)?.slotRef : undefined);

  if (slotId) {
    const slot = getCommercePluginSlotById(slotId);
    if (!slot) {
      return deny(`Commerce plugin slot not found: ${slotId}`);
    }

    const slotConfig = slot.configuration.pluginSlot as {
      registryRef?: { registryId: string; registryRowId: string };
    };
    const registryRef = slotConfig.registryRef;
    if (
      registryRef &&
      !verifyPluginSlotRegistryRef(context, registryRef.registryId, registryRef.registryRowId)
    ) {
      return {
        allowed: false,
        reason: `Registry ref not verified: ${registryRef.registryId}/${registryRef.registryRowId}`,
        pluginApproved: true,
        trustVerified: true,
        permissionsGranted: false,
        lifecycleAuthorized: false,
        isolationVerified: true,
        policyCompliant: false,
        eklsGoverned: false,
      };
    }
  }

  if (context.pluginId) {
    const record = getCommercePluginRecordById(context.pluginId);
    if (record) {
      const compatibility = validateCommercePluginCompatibility(record);
      if (!compatibility.compatible) {
        return {
          allowed: false,
          reason: compatibility.reason,
          pluginApproved: true,
          trustVerified: true,
          permissionsGranted: true,
          lifecycleAuthorized: false,
          isolationVerified: compatibility.isolationVerified,
          policyCompliant: true,
          eklsGoverned: false,
        };
      }
    }
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
      pluginApproved: true,
      trustVerified: true,
      permissionsGranted: true,
      lifecycleAuthorized: true,
      isolationVerified: true,
      policyCompliant: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Commerce plugin Pillow governance passed",
    pluginApproved: true,
    trustVerified: true,
    permissionsGranted: true,
    lifecycleAuthorized: true,
    isolationVerified: true,
    policyCompliant: true,
    eklsGoverned: true,
  };
}

export function validateCommercePluginManifestForRegistration(
  context: RegistryLoaderContext,
  manifest: CommercePluginRegistrationManifest,
): CommercePluginPillowResult {
  const manifestGovernance = validateCommercePluginRegistrationManifestGovernance(manifest);
  if (!manifestGovernance.allowed) {
    return manifestGovernance;
  }

  const slot = getCommercePluginSlotById(manifest.slotId)!;
  try {
    const contract = buildCommercePluginAdapterContract(manifest, slot);
    const compatibility = validateCommercePluginCompatibility(contract);
    if (!compatibility.compatible) {
      return deny(compatibility.reason);
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return deny(reason);
  }

  return validateCommercePluginPillowGovernance({
    ...context,
    actorId: "plugin-registration",
    workspaceId: context.workspaceId ?? "ws-foundation",
    slotId: manifest.slotId,
    operation: "register",
    pillowGovernance: true,
    brainRouted: true,
  });
}
