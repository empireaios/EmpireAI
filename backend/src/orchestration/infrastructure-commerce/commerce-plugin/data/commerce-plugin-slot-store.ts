/**
 * G2-09 — Commerce plugin slot store.
 */

import type { CommercePluginSlotRow } from "../contracts/commerce-plugin-integration-types.js";
import { COMMERCE_PLUGIN_SLOT_CATALOG } from "./commerce-plugin-slot-catalog.js";

const slotStore = new Map<string, CommercePluginSlotRow>();

function ensureLoaded(): void {
  if (slotStore.size > 0) return;
  for (const slot of COMMERCE_PLUGIN_SLOT_CATALOG) {
    slotStore.set(slot.id, slot);
  }
}

export function listCommercePluginSlots(): CommercePluginSlotRow[] {
  ensureLoaded();
  return [...slotStore.values()];
}

export function getCommercePluginSlotById(slotId: string): CommercePluginSlotRow | undefined {
  ensureLoaded();
  return slotStore.get(slotId);
}

export function resetCommercePluginSlotStoreForTests(): void {
  slotStore.clear();
  for (const slot of COMMERCE_PLUGIN_SLOT_CATALOG) {
    slotStore.set(slot.id, slot);
  }
}
