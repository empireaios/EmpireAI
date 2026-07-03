/**
 * G5-01 — Business Automation registry resolver.
 * Consumes Pillow-governed automation registries via RegistryLoader — never owns registry data.
 */

import {
  AUTOMATION_REGISTRY_IDS,
  getRegistryLoader,
  type AutomationRegistryId,
  type RegistryLoaderContext,
  type RegistryQuery,
  type RegistryResolveResult,
} from "../../../registry/index.js";
import type { AutomationRegistryRowBase } from "../../../registry/types/automation-registry-types.js";

export function listAutomationRegistryIds(): readonly AutomationRegistryId[] {
  return AUTOMATION_REGISTRY_IDS;
}

export function resolveAutomationRegistry<T extends AutomationRegistryRowBase = AutomationRegistryRowBase>(
  context: RegistryLoaderContext,
  registryId: AutomationRegistryId,
  query?: RegistryQuery,
): RegistryResolveResult<T> {
  return getRegistryLoader().resolve<T>(context, registryId, query);
}

export function resolveAllAutomationRegistries(
  context: RegistryLoaderContext = {},
): Record<AutomationRegistryId, RegistryResolveResult<AutomationRegistryRowBase>> {
  const catalog = {} as Record<
    AutomationRegistryId,
    RegistryResolveResult<AutomationRegistryRowBase>
  >;
  for (const registryId of AUTOMATION_REGISTRY_IDS) {
    catalog[registryId] = resolveAutomationRegistry(context, registryId);
  }
  return catalog;
}
