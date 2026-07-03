/**
 * G2-08 — Commerce orchestration profile store.
 */

import type { CommerceOrchestrationProfileRow } from "../contracts/commerce-orchestration-types.js";
import { COMMERCE_ORCHESTRATION_PROFILE_SEED } from "../data/commerce-orchestration-profile-catalog.js";

const profileStore = new Map<string, CommerceOrchestrationProfileRow>();

function ensureSeedLoaded(): void {
  if (profileStore.size > 0) return;
  for (const row of COMMERCE_ORCHESTRATION_PROFILE_SEED) {
    profileStore.set(row.id, row);
  }
}

export function listCommerceOrchestrationProfiles(): CommerceOrchestrationProfileRow[] {
  ensureSeedLoaded();
  return [...profileStore.values()];
}

export function getCommerceOrchestrationProfileById(
  profileId: string,
): CommerceOrchestrationProfileRow | undefined {
  ensureSeedLoaded();
  return profileStore.get(profileId);
}

export function registerCommerceOrchestrationProfile(row: CommerceOrchestrationProfileRow): void {
  ensureSeedLoaded();
  profileStore.set(row.id, row);
}

export function resetCommerceOrchestrationProfileStoreForTests(): void {
  profileStore.clear();
  for (const row of COMMERCE_ORCHESTRATION_PROFILE_SEED) {
    profileStore.set(row.id, row);
  }
}
