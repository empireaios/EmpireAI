/**
 * EA-003 — Tier 3 policy/topology and tier 4 workspace placeholder sources.
 * Full migration deferred to future EA missions.
 */

import type { RegistryId } from "../types/registry-ids.js";

export type PlaceholderRegistryNotice = {
  registryId: RegistryId;
  status: "placeholder";
  message: string;
};

export function buildPlaceholderNotice(registryId: RegistryId): PlaceholderRegistryNotice {
  return {
    registryId,
    status: "placeholder",
    message: `${registryId} is declared in EA-002 but not wired in EA-003 foundation`,
  };
}
