/**
 * EA-003 — RegistryLoader validation strategy.
 */

import {
  DERIVED_VIEW_IDS,
  FOUNDATION_PLACEHOLDER_REGISTRY_IDS,
  REGISTRY_IDS,
  type DerivedViewId,
  type RegistryId,
} from "../types/registry-ids.js";
import type { RegistryLoaderContext, RegistryQuery } from "../types/registry-types.js";
import type { RegistryPluginManifest } from "../types/plugin-manifest.js";

export class RegistryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistryValidationError";
  }
}

const WORKSPACE_REQUIRED: RegistryId[] = [
  "REG-TENANT",
  "REG-COMPANY",
  "REG-BRAND",
  "REG-CATEGORY",
  "REG-PRODUCT",
];

export function assertRegistryId(value: string): asserts value is RegistryId {
  if (!(REGISTRY_IDS as readonly string[]).includes(value)) {
    throw new RegistryValidationError(`Unknown registry id: ${value}`);
  }
}

export function assertDerivedViewId(value: string): asserts value is DerivedViewId {
  if (!(DERIVED_VIEW_IDS as readonly string[]).includes(value)) {
    throw new RegistryValidationError(`Unknown derived view id: ${value}`);
  }
}

export function validateResolveRequest(
  context: RegistryLoaderContext,
  registryId: RegistryId,
  query?: RegistryQuery,
): void {
  if (WORKSPACE_REQUIRED.includes(registryId) && !context.workspaceId) {
    throw new RegistryValidationError(
      `${registryId} requires workspaceId in RegistryLoaderContext`,
    );
  }

  if (query?.countryCode && query.countryCode.length !== 2 && query.countryCode !== "GLOBAL") {
    throw new RegistryValidationError(`Invalid countryCode: ${query.countryCode}`);
  }
}

export function validatePluginManifest(manifest: RegistryPluginManifest): void {
  if (!manifest.pluginId.trim()) {
    throw new RegistryValidationError("Plugin manifest requires pluginId");
  }
  if (!manifest.version.trim()) {
    throw new RegistryValidationError("Plugin manifest requires version");
  }
  assertRegistryId(manifest.targetRegistryId);
}

export function isPlaceholderRegistry(registryId: RegistryId): boolean {
  return FOUNDATION_PLACEHOLDER_REGISTRY_IDS.includes(registryId);
}

export function createPlaceholderRows(registryId: RegistryId): never[] {
  return [];
}
